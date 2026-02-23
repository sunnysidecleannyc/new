import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendSMS } from '@/lib/sms'
import { notify } from '@/lib/notify'
import { askSelenas } from '@/lib/selenas'

export const maxDuration = 60

// Rate limiting: max 10 messages per minute per phone
const phoneLimits = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(phone: string): boolean {
  const now = Date.now()
  const entry = phoneLimits.get(phone)
  if (!entry || now > entry.resetAt) {
    phoneLimits.set(phone, { count: 1, resetAt: now + 60 * 1000 })
    return false
  }
  entry.count++
  return entry.count > 10
}

// Dedup: track recent message hashes to ignore Telnyx double-fires
const recentMessages = new Map<string, number>()

function isDuplicate(phone: string, text: string): boolean {
  const key = `${phone}:${text}`
  const now = Date.now()
  const lastSeen = recentMessages.get(key)
  if (lastSeen && now - lastSeen < 30000) return true
  recentMessages.set(key, now)
  if (recentMessages.size > 500) {
    for (const [k, v] of recentMessages) {
      if (now - v > 60000) recentMessages.delete(k)
    }
  }
  return false
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const event = body.data
    const eventType = event?.event_type

    if (!eventType) {
      return NextResponse.json({ ok: true })
    }

    // Handle delivery status updates
    if (eventType === 'message.sent' || eventType === 'message.delivered' || eventType === 'message.failed') {
      const messageId = event.payload?.id
      const status = eventType === 'message.delivered' ? 'delivered'
        : eventType === 'message.failed' ? 'failed'
        : 'sent'

      if (messageId) {
        await supabaseAdmin
          .from('sms_logs')
          .update({ status })
          .eq('telnyx_message_id', messageId)
      }
      return NextResponse.json({ ok: true })
    }

    // Handle inbound messages
    if (eventType === 'message.received') {
      const from = event.payload?.from?.phone_number
      const rawText = (event.payload?.text || '').trim()
      const text = rawText.toUpperCase()

      if (!from) return NextResponse.json({ ok: true })
      if (!rawText) return NextResponse.json({ ok: true })

      const cleanPhone = from.replace(/\D/g, '').slice(-10)

      if (isDuplicate(cleanPhone, rawText)) {
        return NextResponse.json({ ok: true })
      }

      if (isRateLimited(cleanPhone)) {
        console.warn('SMS rate limited:', cleanPhone)
        return NextResponse.json({ ok: true })
      }

      // Handle START OVER / RESET — expire conversation, re-greet on next message
      if (text === 'START OVER' || text === 'RESET') {
        await supabaseAdmin
          .from('sms_conversations')
          .update({ expired: true, updated_at: new Date().toISOString() })
          .ilike('phone', `%${cleanPhone}%`)
          .is('completed_at', null)
          .eq('expired', false)

        return NextResponse.json({ ok: true })
      }

      // Handle STOP — revoke SMS consent
      if (text === 'STOP' || text === 'UNSUBSCRIBE' || text === 'QUIT') {
        await supabaseAdmin
          .from('clients')
          .update({ sms_consent: false })
          .ilike('phone', `%${cleanPhone}%`)

        await supabaseAdmin
          .from('cleaners')
          .update({ sms_consent: false })
          .ilike('phone', `%${cleanPhone}%`)

        await supabaseAdmin
          .from('sms_conversations')
          .update({ expired: true, updated_at: new Date().toISOString() })
          .ilike('phone', `%${cleanPhone}%`)
          .is('completed_at', null)
          .eq('expired', false)

        return NextResponse.json({ ok: true })
      }

      // Handle START/UNSTOP — re-enable SMS consent
      if (text === 'START' || text === 'UNSTOP') {
        await supabaseAdmin
          .from('clients')
          .update({ sms_consent: true })
          .ilike('phone', `%${cleanPhone}%`)

        await supabaseAdmin
          .from('cleaners')
          .update({ sms_consent: true })
          .ilike('phone', `%${cleanPhone}%`)

        return NextResponse.json({ ok: true })
      }

      // Look up if this phone is in the clients table
      const { data: client } = await supabaseAdmin
        .from('clients')
        .select('id, name')
        .ilike('phone', `%${cleanPhone}%`)
        .limit(1)
        .single()

      const label = client?.name || from

      // Helper: log to both sms_conversation_messages AND client_sms_messages
      async function logMsg(convoId: string, direction: 'inbound' | 'outbound', message: string, clientId?: string | null) {
        await supabaseAdmin
          .from('sms_conversation_messages')
          .insert({ conversation_id: convoId, direction, message })
        if (clientId) {
          await supabaseAdmin
            .from('client_sms_messages')
            .insert({ client_id: clientId, direction, message })
            .then(() => {}, () => {})
        }
      }

      // Check for active conversation
      const { data: activeConvo } = await supabaseAdmin
        .from('sms_conversations')
        .select('id, client_id')
        .ilike('phone', `%${cleanPhone}%`)
        .is('completed_at', null)
        .eq('expired', false)
        .order('created_at', { ascending: false })
        .limit(1)

      const convoExists = activeConvo && activeConvo.length > 0

      // ── FIRST MESSAGE — hardcoded greeting ──
      if (!convoExists) {
        const { data: newConvo } = await supabaseAdmin
          .from('sms_conversations')
          .insert({ phone: from, state: 'active', client_id: client?.id || null })
          .select('id')
          .single()

        if (newConvo) {
          await logMsg(newConvo.id, 'inbound', rawText, client?.id)
        }

        let greeting: string
        if (client?.name) {
          const firstName = client.name.split(' ')[0]
          greeting = `Hola ${firstName}, Happy to hear from you again. How are you?`
        } else {
          greeting = `Hola, Thank You for reaching out. How are you?`
        }

        await sendSMS(from, greeting, { skipConsent: true, smsType: 'chatbot' })

        if (newConvo) {
          await logMsg(newConvo.id, 'outbound', greeting, client?.id)
        }

        await notify({
          type: 'sms_reply',
          title: 'Inbound SMS',
          message: `From ${label}: ${rawText.slice(0, 200)}`,
        }).catch(() => {})

        return NextResponse.json({ ok: true })
      }

      // ── MESSAGE 2+ — Selenas via Claude Haiku ──
      const convoId = activeConvo[0].id
      // Get current client_id (may have been set by create_client tool)
      let clientId: string | null = activeConvo[0].client_id || client?.id || null

      await logMsg(convoId, 'inbound', rawText, clientId)

      // Load transcript
      const { data: msgs } = await supabaseAdmin
        .from('sms_conversation_messages')
        .select('direction, message')
        .eq('conversation_id', convoId)
        .order('created_at', { ascending: true })

      const transcript = (msgs || []).slice(0, -1).map(m => ({
        role: m.direction === 'inbound' ? 'user' as const : 'assistant' as const,
        content: m.message,
      }))

      const result = await askSelenas(rawText, convoId, transcript, from, !!client, client?.name)

      // If client was just created by Selenas, fetch the new client_id and backfill
      if (result?.clientCreated && !clientId) {
        const { data: convoData } = await supabaseAdmin
          .from('sms_conversations')
          .select('client_id')
          .eq('id', convoId)
          .single()
        clientId = convoData?.client_id || null

        // Backfill all conversation messages to client_sms_messages
        if (clientId) {
          const { data: allMsgs } = await supabaseAdmin
            .from('sms_conversation_messages')
            .select('direction, message')
            .eq('conversation_id', convoId)
            .order('created_at', { ascending: true })

          if (allMsgs && allMsgs.length > 0) {
            await supabaseAdmin
              .from('client_sms_messages')
              .insert(allMsgs.map(m => ({ client_id: clientId!, direction: m.direction, message: m.message })))
              .then(() => {}, () => {})
          }
        }
      }

      if (result?.text) {
        await sendSMS(from, result.text, { skipConsent: true, smsType: 'chatbot' })
        await logMsg(convoId, 'outbound', result.text, clientId)
      }

      if (result?.bookingCreated) {
        await notify({
          type: 'new_booking',
          title: 'New SMS Booking',
          message: `${label} just confirmed a booking via SMS`,
        }).catch(() => {})
      }

      await notify({
        type: 'sms_reply',
        title: 'Inbound SMS',
        message: `From ${label}: ${rawText.slice(0, 200)}`,
      }).catch(() => {})

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Telnyx webhook error:', err)
    return NextResponse.json({ ok: true })
  }
}
