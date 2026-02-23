import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'
import { clientReminderEmail, clientThankYouEmail, adminPendingRemindersEmail } from '@/lib/email-templates'
import { protectCronAPI } from '@/lib/auth'
import { trackError } from '@/lib/error-tracking'
import { sendPushToClient, sendPushToCleaner, sendPushToAll } from '@/lib/push'

// Get current time in Eastern
function nowET(): Date {
  const str = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
  return new Date(str)
}

// Build a naive datetime string (no tz offset) for comparing against stored booking times
function toNaive(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export async function GET(request: Request) {
  const authError = protectCronAPI(request)
  if (authError) return authError

  try {
  const now = nowET()
  const results: { type: string; booking_id: string }[] = []

  async function sendReminders(daysOut: number, type: string, label: string) {
    const target = new Date(now)
    target.setDate(target.getDate() + daysOut)
    target.setHours(0, 0, 0, 0)
    const targetEnd = new Date(target)
    targetEnd.setHours(23, 59, 59, 999)

    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('*, clients(*), cleaners(*)')
      .gte('start_time', toNaive(target))
      .lte('start_time', toNaive(targetEnd))
      .eq('status', 'scheduled')

    for (const booking of bookings || []) {
      if (booking.clients?.email) {
        const { data: existing } = await supabaseAdmin
          .from('email_logs')
          .select('id')
          .eq('booking_id', booking.id)
          .eq('email_type', type)
          .single()
        if (!existing) {
          const email = clientReminderEmail(booking, label)
          await sendEmail(booking.clients.email, email.subject, email.html)
          await supabaseAdmin.from('email_logs').insert({ booking_id: booking.id, email_type: type, recipient: booking.clients.email })
          results.push({ type, booking_id: booking.id })

          // Push alongside 1-day reminders
          if (type === 'reminder_1day') {
            const reminderDate = new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            if (booking.client_id) {
              sendPushToClient(booking.client_id, 'Cleaning Tomorrow', `Your cleaning is ${label} - ${reminderDate}`, '/book/dashboard').catch(() => {})
            }
            if (booking.cleaner_id) {
              sendPushToCleaner(booking.cleaner_id, 'Job Tomorrow', `${booking.clients?.name} - ${label}`, '/team/dashboard').catch(() => {})
            }
          }
        }
      }
    }
  }

  // Daily reminders — send between 8-9am ET
  if (now.getHours() === 8) {
    await sendReminders(7, 'reminder_7day', 'in 7 days')
    await sendReminders(3, 'reminder_3day', 'in 3 days')
    await sendReminders(1, 'reminder_1day', 'tomorrow')
  }

  // 2-hour reminder — runs every hour, looks 2hrs ahead
  const twoHoursAhead = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const windowStart = new Date(twoHoursAhead)
  windowStart.setMinutes(0, 0, 0)
  const windowEnd = new Date(windowStart)
  windowEnd.setMinutes(59, 59, 999)

  const { data: bookings2h } = await supabaseAdmin
    .from('bookings')
    .select('*, clients(*), cleaners(*)')
    .gte('start_time', toNaive(windowStart))
    .lte('start_time', toNaive(windowEnd))
    .eq('status', 'scheduled')

  for (const booking of bookings2h || []) {
    if (booking.clients?.email) {
      const { data: existing } = await supabaseAdmin
        .from('email_logs')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('email_type', 'reminder_2hour')
        .single()
      if (!existing) {
        const email = clientReminderEmail(booking, 'in 2 hours')
        await sendEmail(booking.clients.email, email.subject, email.html)
        await supabaseAdmin.from('email_logs').insert({ booking_id: booking.id, email_type: 'reminder_2hour', recipient: booking.clients.email })
        results.push({ type: '2hour', booking_id: booking.id })

        // Push alongside 2-hour reminders
        if (booking.client_id) {
          sendPushToClient(booking.client_id, 'Cleaning in 2 Hours', `Your cleaner ${booking.cleaners?.name || ''} arrives soon`, '/book/dashboard').catch(() => {})
        }
        if (booking.cleaner_id) {
          sendPushToCleaner(booking.cleaner_id, 'Job in 2 Hours', `${booking.clients?.name} - starting soon`, '/team/dashboard').catch(() => {})
        }
      }
    }
  }

  // ---- 4-hour reminder ----
  const fourHoursAhead = new Date(now.getTime() + 4 * 60 * 60 * 1000)
  const window4hStart = new Date(fourHoursAhead)
  window4hStart.setMinutes(0, 0, 0)
  const window4hEnd = new Date(window4hStart)
  window4hEnd.setMinutes(59, 59, 999)

  const { data: bookings4h } = await supabaseAdmin
    .from('bookings')
    .select('*, clients(*), cleaners(*)')
    .gte('start_time', toNaive(window4hStart))
    .lte('start_time', toNaive(window4hEnd))
    .eq('status', 'scheduled')

  for (const booking of bookings4h || []) {
    if (booking.clients?.email) {
      const { data: existing } = await supabaseAdmin
        .from('email_logs')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('email_type', 'reminder_4hour')
        .single()
      if (!existing) {
        const email = clientReminderEmail(booking, 'in 4 hours')
        await sendEmail(booking.clients.email, email.subject, email.html)
        await supabaseAdmin.from('email_logs').insert({ booking_id: booking.id, email_type: 'reminder_4hour', recipient: booking.clients.email })
        results.push({ type: '4hour', booking_id: booking.id })

        if (booking.client_id) {
          sendPushToClient(booking.client_id, 'Cleaning in 4 Hours', `Your cleaner ${booking.cleaners?.name || ''} is scheduled soon`, '/book/dashboard').catch(() => {})
        }
        if (booking.cleaner_id) {
          sendPushToCleaner(booking.cleaner_id, 'Job in 4 Hours', `${booking.clients?.name} - coming up`, '/team/dashboard').catch(() => {})
        }
      }
    }
  }

  // ---- 15-min before done: Payment notification ----
  const fifteenMinFromNow = new Date(now.getTime() + 15 * 60 * 1000)
  const payWindowStart = new Date(now.getTime() + 10 * 60 * 1000)
  const payWindowEnd = new Date(now.getTime() + 20 * 60 * 1000)

  const { data: endingSoonBookings } = await supabaseAdmin
    .from('bookings')
    .select('*, clients(*), cleaners(*)')
    .eq('status', 'in_progress')
    .gte('end_time', toNaive(payWindowStart))
    .lte('end_time', toNaive(payWindowEnd))

  for (const booking of endingSoonBookings || []) {
    const { data: existing } = await supabaseAdmin
      .from('email_logs')
      .select('id')
      .eq('booking_id', booking.id)
      .eq('email_type', 'payment_15min')
      .single()
    if (existing) continue

    const durationMs = new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()
    const hours = durationMs / (1000 * 60 * 60)
    const hourlyRate = booking.hourly_rate || 75
    const amount = (hours * hourlyRate).toFixed(0)
    const clientName = booking.clients?.name || 'Client'
    const cleanerName = booking.cleaners?.name || 'Cleaner'

    // Dedup log
    await supabaseAdmin.from('email_logs').insert({ booking_id: booking.id, email_type: 'payment_15min', recipient: 'admin-only' })
    results.push({ type: 'payment_15min', booking_id: booking.id })

    // NOTE: Client payment email/SMS removed — clients should not receive amount owed

    // Push to admin
    sendPushToAll('Collect Payment', `${clientName} — $${amount} due in 15 min`, '/admin/bookings').catch(() => {})

    // Dashboard notification
    await supabaseAdmin.from('notifications').insert({
      type: 'payment_due',
      title: 'Payment Due Soon',
      message: `${clientName} — $${amount} due in 15 min (${cleanerName})`
    })
  }

  // ---- Thank You Email: 3 days after first-time client's completed booking ----
  if (now.getHours() === 8) {
    const threeDaysAgo = new Date(now)
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    threeDaysAgo.setHours(0, 0, 0, 0)
    const threeDaysAgoEnd = new Date(threeDaysAgo)
    threeDaysAgoEnd.setHours(23, 59, 59, 999)

    // Find bookings completed ~3 days ago
    const { data: completedBookings } = await supabaseAdmin
      .from('bookings')
      .select('*, clients(*)')
      .eq('status', 'completed')
      .gte('end_time', toNaive(threeDaysAgo))
      .lte('end_time', toNaive(threeDaysAgoEnd))

    for (const booking of completedBookings || []) {
      if (!booking.clients?.email || !booking.client_id) continue

      // Check if we already sent a thank you for this client (within last year)
      const oneYearAgo = new Date(now)
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      const { data: alreadySent } = await supabaseAdmin
        .from('email_logs')
        .select('id')
        .eq('email_type', 'thank_you')
        .eq('recipient', booking.clients.email)
        .gte('created_at', oneYearAgo.toISOString())
        .maybeSingle()
      if (alreadySent) continue

      // Check this was their first booking (no earlier completed bookings)
      const { count } = await supabaseAdmin
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', booking.client_id)
        .eq('status', 'completed')
        .lt('end_time', toNaive(threeDaysAgo))

      if ((count || 0) === 0) {
        const email = clientThankYouEmail(booking.clients.name || '')
        await sendEmail(booking.clients.email, email.subject, email.html)
        await supabaseAdmin.from('email_logs').insert({ booking_id: booking.id, email_type: 'thank_you', recipient: booking.clients.email })
        results.push({ type: 'thank_you', booking_id: booking.id })

      }
    }
  }

  // ---- Unpaid Team Notification: Notify admin at 8am about completed jobs where team hasn't been paid ----
  if (now.getHours() === 8) {
    const twoDaysAgo = new Date(now)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    const { data: unpaidBookings } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('status', 'completed')
      .lt('end_time', toNaive(twoDaysAgo))
      .or('cleaner_paid.is.null,cleaner_paid.eq.false')

    if (unpaidBookings && unpaidBookings.length > 0) {
      await supabaseAdmin.from('notifications').insert({
        type: 'unpaid_team',
        title: 'Unpaid Team',
        message: `${unpaidBookings.length} completed job${unpaidBookings.length !== 1 ? 's' : ''} with unpaid team`
      })
      results.push({ type: 'unpaid_team', booking_id: 'admin' })
    }
  }

  // ---- Pending Booking Reminders: Notify admin at 8am and 2pm about unassigned pending bookings ----
  if (now.getHours() === 8 || now.getHours() === 14) {
    const { data: pendingBookings } = await supabaseAdmin
      .from('bookings')
      .select('*, clients(*)')
      .eq('status', 'pending')
      .order('start_time', { ascending: true })

    if (pendingBookings && pendingBookings.length > 0) {
      // Create dashboard notification
      await supabaseAdmin.from('notifications').insert({
        type: 'pending_reminder',
        title: 'Pending Bookings',
        message: `${pendingBookings.length} booking${pendingBookings.length !== 1 ? 's' : ''} still pending — review and assign`
      })

      // Send admin email
      if (process.env.ADMIN_EMAIL) {
        const emailData = pendingBookings.map((b: any) => ({
          client_name: b.clients?.name || 'Unknown',
          date: new Date(b.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
          service_type: b.service_type || 'Standard Cleaning'
        }))
        const email = adminPendingRemindersEmail(emailData)
        await sendEmail(process.env.ADMIN_EMAIL, email.subject, email.html)
        results.push({ type: 'pending_reminder', booking_id: 'admin' })
      }
    }
  }

  return NextResponse.json({ success: true, sent: results.length, results })
  } catch (err) {
    await trackError(err, { source: 'cron/reminders', severity: 'critical' })
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
