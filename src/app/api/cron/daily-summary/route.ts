import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'
import { cleanerDailySummaryEmail } from '@/lib/email-templates'
import { protectCronAPI } from '@/lib/auth'
import { trackError } from '@/lib/error-tracking'

export async function GET(request: Request) {
  // Protect cron route
  const authError = protectCronAPI(request)
  if (authError) return authError

  try {
  // Use ET-aware dates so we get the correct "tomorrow" regardless of server timezone
  const nowET = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const tomorrow = new Date(nowET)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const tomorrowEnd = new Date(tomorrow)
  tomorrowEnd.setHours(23, 59, 59, 999)

  const { data: cleaners } = await supabaseAdmin.from('cleaners').select('*').eq('active', true)
  const results = []

  for (const cleaner of cleaners || []) {
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('*, clients(*)')
      .eq('cleaner_id', cleaner.id)
      .gte('start_time', tomorrow.toISOString())
      .lte('start_time', tomorrowEnd.toISOString())
      .in('status', ['scheduled', 'pending'])
      .order('start_time')

    if (bookings && bookings.length > 0) {
      if (cleaner.email) {
        const emailContent = cleanerDailySummaryEmail(cleaner, bookings)
        await sendEmail(cleaner.email, emailContent.subject, emailContent.html)
      }
      results.push({ cleaner: cleaner.name, jobs: bookings.length })
    }
  }

  // Check for recurring bookings ending soon (within 30 days)
  const expiringRecurring = await checkExpiringRecurring()

  return NextResponse.json({ sent: results.length, details: results, expiringRecurring })
  } catch (err) {
    await trackError(err, { source: 'cron/daily-summary', severity: 'critical' })
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}

async function checkExpiringRecurring() {
  const now = new Date()
  const thirtyDaysOut = new Date()
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30)

  // Get all recurring bookings
  const { data: recurringBookings } = await supabaseAdmin
    .from('bookings')
    .select('client_id, recurring_type, start_time, clients(name, email)')
    .not('recurring_type', 'is', null)
    .in('status', ['scheduled', 'confirmed'])
    .order('start_time', { ascending: false })

  if (!recurringBookings || recurringBookings.length === 0) return []

  // Group by client + recurring_type to find unique series
  const seriesMap = new Map<string, { clientId: string; clientName: string; clientEmail: string; recurringType: string; lastBooking: string }>()

  for (const booking of recurringBookings) {
    const key = `${booking.client_id}-${booking.recurring_type}`
    if (!seriesMap.has(key)) {
      seriesMap.set(key, {
        clientId: booking.client_id,
        clientName: (booking.clients as any)?.name || 'Unknown',
        clientEmail: (booking.clients as any)?.email || '',
        recurringType: booking.recurring_type!,
        lastBooking: booking.start_time
      })
    }
  }

  const expiringSeries = []

  for (const [key, series] of seriesMap) {
    const lastDate = new Date(series.lastBooking)

    // Check if last booking is within 30 days
    if (lastDate <= thirtyDaysOut && lastDate >= now) {
      // Check if we already notified about this series recently (within 7 days)
      const notifKey = `recurring_expiring_${series.clientId}_${series.recurringType}`
      const { data: existingNotif } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .eq('type', 'recurring_expiring')
        .like('message', `%${series.clientName}%${series.recurringType}%`)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1)

      if (!existingNotif || existingNotif.length === 0) {
        const lastDateStr = lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

        // Create dashboard notification
        await supabaseAdmin.from('notifications').insert({
          type: 'recurring_expiring',
          title: 'Recurring Booking Ending Soon',
          message: `${series.clientName} - ${series.recurringType} ends ${lastDateStr}`
        })

        // Send admin email
        if (process.env.ADMIN_EMAIL) {
          const html = `
            <div style="font-family: sans-serif; max-width: 500px;">
              <h2 style="color: #000;">Recurring Booking Ending Soon</h2>
              <p><strong>Client:</strong> ${series.clientName}</p>
              <p><strong>Schedule:</strong> ${series.recurringType}</p>
              <p><strong>Last Booking:</strong> ${lastDateStr}</p>
              <p style="margin-top: 20px;">
                <a href="https://www.thenycmaid.com/admin/bookings" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Extend in Dashboard</a>
              </p>
            </div>
          `
          await sendEmail(process.env.ADMIN_EMAIL, `Recurring ending: ${series.clientName} (${series.recurringType})`, html)
        }

        expiringSeries.push({ client: series.clientName, type: series.recurringType, lastBooking: lastDateStr })
      }
    }
  }

  return expiringSeries
}
