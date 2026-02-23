import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateToken } from '@/lib/tokens'
import { sendEmail } from '@/lib/email'
import { sendSMS } from '@/lib/sms'
import { adminNewBookingRequestEmail, referralSignupNotifyEmail } from '@/lib/email-templates'
import { smsNewBooking } from '@/lib/sms-templates'
import { autoAttributeBooking } from '@/lib/attribution'
import { notify } from '@/lib/notify'


// Rate limiting: 3 bookings per 10 minutes per IP
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
      return NextResponse.json({ error: 'Too many booking attempts. Please wait a few minutes.' }, { status: 429 })
    }

    const body = await request.json()

    // ===== VALIDATE REQUIRED FIELDS =====
    if (!body.client_id && !body.email && !body.phone) {
      return NextResponse.json({ error: 'Client ID, email, or phone is required' }, { status: 400 })
    }

    // ===== CHECK DNS STATUS =====
    if (body.client_id) {
      const { data: dnsCheck } = await supabaseAdmin.from('clients').select('do_not_service').eq('id', body.client_id).single()
      if (dnsCheck?.do_not_service) {
        return NextResponse.json({ error: 'Please contact us at (212) 202-8400 to schedule your next service.' }, { status: 403 })
      }
    }

    // ===== HANDLE NEW CLIENT =====
    let clientId = body.client_id
    let isNewClient = false

    if (!clientId && body.email) {
      const phone = body.phone?.replace(/\D/g, '') || ''
      const emailLower = body.email.toLowerCase()

      const { data: byEmail } = await supabaseAdmin
        .from('clients').select('id').eq('email', emailLower).single()

      if (byEmail) {
        clientId = byEmail.id
      } else if (phone) {
        const { data: byPhone } = await supabaseAdmin
          .from('clients').select('id').eq('phone', phone).single()
        if (byPhone) clientId = byPhone.id
      }

      if (!clientId) {
        const { data: newClient, error: clientError } = await supabaseAdmin
          .from('clients')
          .insert({
            name: body.name,
            email: emailLower,
            phone: phone,
            address: body.address + (body.unit ? ', ' + body.unit : ''),
            notes: body.notes || ''
          })
          .select().single()

        if (clientError) {
          return NextResponse.json({ error: 'Failed to create client: ' + clientError.message }, { status: 500 })
        }
        clientId = newClient.id
        isNewClient = true

        // Notify admin about new client created via booking form
        await notify({ type: 'new_client', title: 'New Client (via Booking)', message: `${body.name} • ${emailLower}${phone ? ' • ' + phone : ''}` })
      }
    }

    // ===== HANDLE REFERRAL =====
    let referrerId = null
    let referrerData = null
    if (body.ref_code) {
      const { data: referrer } = await supabaseAdmin
        .from('referrers')
        .select('id, name, email')
        .eq('ref_code', body.ref_code.toUpperCase())
        .eq('active', true)
        .single()

      if (referrer) {
        referrerId = referrer.id
        referrerData = referrer
        if (clientId) {
          await supabaseAdmin.from('clients').update({ referrer_id: referrerId }).eq('id', clientId).is('referrer_id', null)
        }
      }
    }

    // Try matching referrer by phone if name/phone provided (no ref_code match)
    if (!referrerId && body.referrer_phone) {
      const refPhone = body.referrer_phone.replace(/\D/g, '')
      if (refPhone.length >= 10) {
        const { data: byPhone } = await supabaseAdmin
          .from('referrers')
          .select('id, name, email')
          .ilike('phone', `%${refPhone.slice(-10)}%`)
          .eq('active', true)
          .limit(1)

        if (byPhone && byPhone.length > 0) {
          referrerId = byPhone[0].id
          referrerData = byPhone[0]
          if (clientId) {
            await supabaseAdmin.from('clients').update({ referrer_id: referrerId }).eq('id', clientId).is('referrer_id', null)
          }
        } else {
          // Referrer not in system — notify admin to text them signup link
          await supabaseAdmin.from('notifications').insert({
            type: 'referral_lead',
            title: 'New Referrer Lead',
            message: `${body.referrer_name || 'Unknown'} (${body.referrer_phone}) referred ${body.name} — not in system. Text them: thenycmaid.com/referral/signup`
          })
        }
      }
    } else if (!referrerId && body.referrer_name && !body.ref_code) {
      // Name only, no phone — try name match
      const { data: byName } = await supabaseAdmin
        .from('referrers')
        .select('id, name, email')
        .ilike('name', `%${body.referrer_name.trim()}%`)
        .eq('active', true)
        .limit(1)

      if (byName && byName.length > 0) {
        referrerId = byName[0].id
        referrerData = byName[0]
        if (clientId) {
          await supabaseAdmin.from('clients').update({ referrer_id: referrerId }).eq('id', clientId).is('referrer_id', null)
        }
      } else {
        await supabaseAdmin.from('notifications').insert({
          type: 'referral_lead',
          title: 'New Referrer Lead',
          message: `${body.referrer_name} referred ${body.name} — not in system (no phone provided)`
        })
      }
    }

    // ===== CALCULATE TIMES =====
    let startTime = body.start_time
    let endTime = body.end_time

    if (body.date && body.time && !startTime) {
      const timeMap: Record<string, number> = {
        '9:00 AM': 9, '10:00 AM': 10, '11:00 AM': 11, '12:00 PM': 12,
        '1:00 PM': 13, '2:00 PM': 14, '3:00 PM': 15, '4:00 PM': 16
      }
      const hour = timeMap[body.time] || 9
      startTime = body.date + 'T' + hour.toString().padStart(2, '0') + ':00:00'
      endTime = body.date + 'T' + (hour + 2).toString().padStart(2, '0') + ':00:00'
    }

    const cleanerToken = generateToken()
    const tokenExpiresAt = new Date(startTime)
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24)

    // ===== CREATE BOOKING (always pending from public form) =====
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        client_id: clientId,
        cleaner_id: null, // Admin assigns cleaner
        start_time: startTime,
        end_time: endTime,
        service_type: body.service_type || 'Standard Cleaning',
        status: 'pending', // Always pending until admin confirms
        price: body.price || (body.hourly_rate || 75) * 2 * 100,
        hourly_rate: body.hourly_rate || 75,
        notes: body.notes || '',
        recurring_type: body.recurring_type === 'none' ? null : body.recurring_type,
        cleaner_token: cleanerToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        referrer_id: referrerId,
        ref_code: body.ref_code || null
      })
      .select('*, clients(*)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // ===== NOTIFICATION =====
    const bookingMsg = 'New booking from ' + (data.clients?.name || 'Unknown') + (body.ref_code ? ' (Ref: ' + body.ref_code + ')' : '') + ' • by Client'
    await notify({ type: 'new_booking', title: 'New Booking Request', message: bookingMsg, booking_id: data.id, url: '/admin/bookings' })

    // Auto-attribute booking to lead source
    try {
      if (body.src) {
        // Direct attribution — domain passed through URL param
        await supabaseAdmin
          .from('bookings')
          .update({ attributed_domain: body.src, attribution_confidence: 100, attributed_at: new Date().toISOString() })
          .eq('id', data.id)
      } else {
        await autoAttributeBooking(data.id, clientId, data.created_at)
      }
    } catch (attrErr) {
      console.error('Attribution error:', attrErr)
    }

    // ===== EMAILS =====
    try {
      // Admin only - to review and confirm
      if (process.env.ADMIN_EMAIL) {
        const adminEmail = adminNewBookingRequestEmail(data, {
          time: body.time,
          ref_code: body.ref_code,
          referred_by: body.referred_by
        })
        const result = await sendEmail(process.env.ADMIN_EMAIL, adminEmail.subject, adminEmail.html)
        if (!result.success) {
          await notify({ type: 'error', title: 'Email Failed', message: `Failed to send booking email for ${data.clients?.name || 'Unknown'}` })
        }
      }

      // Referrer gets notified of signup
      if (referrerData?.email) {
        const bookingDate = new Date(startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
        const refEmail = referralSignupNotifyEmail(referrerData.name, bookingDate)
        await sendEmail(referrerData.email, refEmail.subject, refEmail.html)
      }

      // No admin SMS — notifications via email + dashboard only

      // NOTE: Client & cleaner emails sent when admin confirms booking
    } catch (emailError) {
      console.error('Email error:', emailError)
      await notify({ type: 'error', title: 'Email Failed', message: `Booking email error for ${data.clients?.name || 'Unknown'}` })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Booking error:', err)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}
