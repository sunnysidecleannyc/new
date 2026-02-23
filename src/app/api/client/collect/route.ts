import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'
import { sendSMS } from '@/lib/sms'
import { adminNewClientEmail } from '@/lib/email-templates'
import { trackError } from '@/lib/error-tracking'
import { attributeCollectForm } from '@/lib/attribution'
import { notify } from '@/lib/notify'


// Rate limiting: 3 submissions per 10 minutes per IP
const rateLimits = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return false
  }
  entry.count++
  return entry.count > 3
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many submissions. Please wait a few minutes.' }, { status: 429 })
    }

    const body = await request.json()
    const { name, email, phone, address, notes, referrer_name, referrer_phone, src, convo_id } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    // Check for existing client by phone
    const cleanPhone = phone.replace(/\D/g, '')
    const { data: existing } = await supabaseAdmin
      .from('clients')
      .select('id, status')
      .or(`phone.ilike.%${cleanPhone.slice(-10)}%`)
      .limit(1)

    const existingClient = existing?.[0]

    // Look up referrer by phone, then by name
    let referrerId = null
    if (referrer_phone) {
      const refPhone = referrer_phone.replace(/\D/g, '')
      if (refPhone.length >= 10) {
        const { data: byPhone } = await supabaseAdmin
          .from('referrers')
          .select('id')
          .ilike('phone', `%${refPhone.slice(-10)}%`)
          .eq('active', true)
          .limit(1)

        if (byPhone && byPhone.length > 0) {
          referrerId = byPhone[0].id
        } else {
          // Referrer not in system — notify admin to text them signup link
          await supabaseAdmin.from('notifications').insert({
            type: 'referral_lead',
            title: 'New Referrer Lead',
            message: `${referrer_name || 'Unknown'} (${referrer_phone}) referred ${name} — not in system. Text them: thenycmaid.com/referral/signup`
          })
        }
      }
    } else if (referrer_name) {
      // Name only, no phone — try name match
      const { data: byName } = await supabaseAdmin
        .from('referrers')
        .select('id')
        .ilike('name', `%${referrer_name.trim()}%`)
        .eq('active', true)
        .limit(1)

      if (byName && byName.length > 0) {
        referrerId = byName[0].id
      } else {
        await supabaseAdmin.from('notifications').insert({
          type: 'referral_lead',
          title: 'New Referrer Lead',
          message: `${referrer_name} referred ${name} — not in system (no phone provided)`
        })
      }
    }

    const referralInfo = referrer_name ? `${referrer_name}${referrer_phone ? ' (' + referrer_phone + ')' : ''}` : null
    const clientNotes = referralInfo && !referrerId
      ? `Referral: ${referralInfo}${notes ? '\n' + notes : ''}`
      : notes || null

    const notesValue = src ? `Source: ${src}${clientNotes ? '\n' + clientNotes : ''}` : clientNotes

    let data: { id: string; [key: string]: unknown }

    if (existingClient) {
      // Existing client (potential or active) — update info from form
      // Don't overwrite phone — the Telnyx E.164 format is more reliable for matching
      const { data: updated, error } = await supabaseAdmin
        .from('clients')
        .update({
          name,
          email: email || null,
          address: address || null,
          notes: notesValue,
          referrer_id: referrerId || undefined,
          status: 'active',
        })
        .eq('id', existingClient.id)
        .select()
        .single()

      if (error) throw error
      data = updated as { id: string; [key: string]: unknown }
    } else {
      // Brand new client (no chatbot interaction)
      const { data: inserted, error } = await supabaseAdmin
        .from('clients')
        .insert({
          name,
          email: email || null,
          phone,
          address: address || null,
          notes: notesValue,
          referrer_id: referrerId,
        })
        .select()
        .single()

      if (error) throw error
      data = inserted as { id: string; [key: string]: unknown }
    }

    // Dashboard notification + push
    await notify({ type: 'new_client', title: 'New Client Collected', message: name + (src ? ' • from ' + src : '') + (referralInfo ? ' (Ref: ' + referralInfo + ')' : '') + ' • via Collect Form' })

    // Admin email + SMS
    try {
      if (process.env.ADMIN_EMAIL) {
        const clientEmail = adminNewClientEmail({
          name, phone, email, address,
          notes: clientNotes || undefined,
          referral_info: referralInfo || undefined,
          referrer_matched: !!referrerId
        })
        const result = await sendEmail(process.env.ADMIN_EMAIL, clientEmail.subject, clientEmail.html)
        if (!result.success) {
          await notify({ type: 'error', title: 'Email Failed', message: `Failed to send new-client email for ${name}: ${JSON.stringify(result.error).slice(0, 100)}` })
        } else {
          console.log('Collect email sent:', result.data)
        }
      }
      // No admin SMS — all admin notifications via email + dashboard only
    } catch (emailErr) {
      console.error('Collect email error:', emailErr)
      await notify({ type: 'error', title: 'Email Failed', message: `Failed to send new-client email for ${name}` })
    }

    // Attribution: check if this lead came from a website visit
    if (address) {
      try {
        await attributeCollectForm(name, address, data.id)
      } catch (attrErr) {
        console.error('Collect attribution error:', attrErr)
      }
    }

    // Handle SMS chatbot conversation
    if (convo_id) {
      try {
        const { data: convo, error: convoErr } = await supabaseAdmin
          .from('sms_conversations')
          .select('*')
          .eq('id', convo_id)
          .is('completed_at', null)
          .single()

        if (convoErr || !convo) {
          console.error('Chatbot conversation not found:', convo_id, convoErr)
        } else if (convo.client_id) {
          // ── Active Selenas conversation: form submitted mid-chat ──
          // Don't set completed_at (keeps conversation alive)
          // Don't send generic confirmation (Selenas handles acknowledgment)
          // Just link the conversation to the updated client and note form is done
          await supabaseAdmin
            .from('sms_conversations')
            .update({
              client_id: data.id,
              state: 'form_received',
              updated_at: new Date().toISOString(),
            })
            .eq('id', convo_id)

          // Build recap from conversation data + form address
          const firstName = (name || '').split(' ')[0]
          const prefDate = convo.preferred_date
            ? new Date(convo.preferred_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York' })
            : null
          const prefTime = convo.preferred_time || null
          const clientAddress = address || null

          // Try to get rate from conversation, or scan transcript for pricing
          let rate = convo.hourly_rate ? `$${convo.hourly_rate}/hr` : null
          if (!rate) {
            const { data: msgs } = await supabaseAdmin
              .from('sms_conversation_messages')
              .select('direction, message')
              .eq('conversation_id', convo_id)
              .order('created_at', { ascending: false })
              .limit(10)
            if (msgs) {
              for (const m of msgs) {
                const priceMatch = m.message.match(/\$(\d+)\/hr/)
                if (priceMatch) { rate = `$${priceMatch[1]}/hr`; break }
              }
            }
          }

          let recapMsg: string
          if (prefDate && clientAddress) {
            const parts = [`We're scheduling you for ${prefDate}`]
            if (clientAddress) parts.push(`at ${clientAddress}`)
            if (prefTime) parts.push(`at ${prefTime}`)
            parts.push(`We always allow for an additional 30 minutes due to traffic.`)
            if (rate) parts.push(`Billed at the rate of ${rate}, paid via Zelle (hi@thenycmaid.com) or Apple Pay about 15 minutes before completion.`)
            else parts.push(`Paid via Zelle (hi@thenycmaid.com) or Apple Pay about 15 minutes before completion.`)

            recapMsg = `Ok ${firstName}, got your info ty! 😊 I'm going to get you added to the schedule now, let's recap:\n\n${parts.join('. ').replace(/\.\./g, '.')}\n\nI want to make sure all is correct as we have a no cancellation policy for first time and one-time services 😊`
          } else if (prefDate) {
            recapMsg = `Ok ${firstName}, got your info ty! 😊 I'm going to get you added to the schedule now.\n\nWe have you down for ${prefDate}${prefTime ? ' at ' + prefTime : ''}${rate ? ', ' + rate : ''}. Paid via Zelle (hi@thenycmaid.com) or Apple Pay about 15 minutes before completion.\n\nI want to make sure all is correct as we have a no cancellation policy for first time and one-time services 😊`
          } else {
            recapMsg = `Ok ${firstName}, got your info ty! 😊 Let me get you added to the schedule now. I'll send you a confirmation with all the details shortly!\n\nJust a heads up — we have a no cancellation policy for first time and one-time services 😊`
          }

          await sendSMS(convo.phone, recapMsg, { skipConsent: true, smsType: 'chatbot' })

          // Log to both transcript tables
          await supabaseAdmin.from('sms_conversation_messages').insert({
            conversation_id: convo_id,
            direction: 'outbound',
            message: recapMsg,
          }).then(() => {}, () => {})
          await supabaseAdmin.from('client_sms_messages').insert({
            client_id: data.id,
            direction: 'outbound',
            message: recapMsg,
          }).then(() => {}, () => {})
        } else {
          // ── Legacy flow: no active Selenas chat, complete conversation ──
          let bookingId: string | null = convo.booking_id || null

          if (!bookingId && convo.service_type && convo.hourly_rate) {
            const placeholderDate = new Date()
            placeholderDate.setDate(placeholderDate.getDate() + 3)
            placeholderDate.setHours(10, 0, 0, 0)
            const endTime = new Date(placeholderDate.getTime() + 2 * 60 * 60 * 1000)

            const { data: booking, error: bookingErr } = await supabaseAdmin
              .from('bookings')
              .insert({
                client_id: data.id,
                start_time: placeholderDate.toISOString(),
                end_time: endTime.toISOString(),
                status: 'pending',
                service_type: convo.service_type,
                hourly_rate: convo.hourly_rate,
                price: (convo.hourly_rate || 65) * 2 * 100,
                notes: `SMS chatbot booking | ${convo.bedrooms ?? 0}BR/${convo.bathrooms ?? 0}BA | ${convo.pricing_choice === 'client_supplies' ? 'client supplies' : 'we provide'} | NEEDS DATE/TIME`,
              })
              .select()
              .single()

            if (bookingErr) {
              console.error('Chatbot booking creation error:', bookingErr)
            } else {
              bookingId = booking.id
            }
          }

          await supabaseAdmin
            .from('sms_conversations')
            .update({
              client_id: data.id,
              booking_id: bookingId,
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', convo_id)

          // Migrate transcript (no client_id means messages weren't mirrored)
          try {
            const { data: convoMsgs } = await supabaseAdmin
              .from('sms_conversation_messages')
              .select('direction, message, created_at')
              .eq('conversation_id', convo_id)
              .order('created_at', { ascending: true })

            if (convoMsgs && convoMsgs.length > 0) {
              await supabaseAdmin.from('client_sms_messages').insert(
                convoMsgs.map(m => ({
                  client_id: data.id,
                  direction: m.direction,
                  message: m.message,
                  created_at: m.created_at
                }))
              )
            }
          } catch (migErr) {
            console.error('Transcript migration error:', migErr)
          }

          const confirmMsg = bookingId
            ? `Thanks for signing up with NYC Maid! 🎉\n\nWe got your info and cleaning details. We'll be in touch shortly to confirm your date and time.\n\nQuestions? Just text us back here!`
            : `Thanks for signing up with NYC Maid! 🎉\n\nWe got your info. We'll be in touch shortly to get you scheduled.\n\nQuestions? Just text us back here!`
          await sendSMS(convo.phone, confirmMsg, { skipConsent: true, smsType: 'chatbot' })
          await supabaseAdmin.from('client_sms_messages').insert({
            client_id: data.id,
            direction: 'outbound',
            message: confirmMsg
          }).then(() => {}, () => {})

          if (bookingId) {
            await notify({
              type: 'new_booking',
              title: 'SMS Chatbot Booking',
              message: `${name} | ${convo.service_type} | ${convo.bedrooms ?? 0}BR/${convo.bathrooms ?? 0}BA | $${convo.hourly_rate}/hr | NEEDS SCHEDULING`,
            })
          } else {
            await notify({
              type: 'new_booking',
              title: 'SMS Chatbot Client',
              message: `${name} | NEEDS SCHEDULING — check transcript`,
            })
          }
        }
      } catch (chatbotErr) {
        console.error('Chatbot completion error:', chatbotErr)
      }
    }

    return NextResponse.json({ success: true, client_id: data.id })
  } catch (err) {
    console.error('Client collect error:', err)
    await trackError(err, { source: 'api/client/collect', severity: 'high' })
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
