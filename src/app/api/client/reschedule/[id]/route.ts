import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'
import { clientRescheduleEmail, adminRescheduleEmail, cleanerRescheduleEmail } from '@/lib/email-templates'
import { sendPushToCleaner } from '@/lib/push'
import { protectClientAPI, isAdminAuthenticated } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  // Get the current booking before updating (for old date/time in emails)
  const { data: oldBooking } = await supabaseAdmin
    .from('bookings')
    .select('*, clients(*), cleaners(*)')
    .eq('id', id)
    .single()

  // Allow admin or authenticated client who owns this booking
  if (oldBooking) {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      const auth = await protectClientAPI(oldBooking.client_id)
      if (auth instanceof NextResponse) return auth
    }
  }

  const oldDate = oldBooking ? new Date(oldBooking.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''
  const oldTime = oldBooking ? new Date(oldBooking.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update({
      start_time: body.start_time,
      end_time: body.end_time,
      cleaner_id: body.cleaner_id
    })
    .eq('id', id)
    .select('*, clients(*), cleaners(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Add notification
  await supabaseAdmin.from('notifications').insert({
    booking_id: id,
    type: 'reschedule',
    message: 'Booking rescheduled for ' + (data.clients?.name || 'Unknown') + ' to ' + new Date(body.start_time).toLocaleDateString() + ' • by Client'
  })

  // Send emails
  try {
    // 1. Client confirmation email
    if (data.clients?.email) {
      const email = clientRescheduleEmail(data, oldDate, oldTime)
      await sendEmail(data.clients.email, email.subject, email.html)
    }

    // 2. Admin notification email
    if (process.env.ADMIN_EMAIL) {
      const email = adminRescheduleEmail(data, oldDate, oldTime)
      await sendEmail(process.env.ADMIN_EMAIL, email.subject, email.html)
    }

    // 3. Cleaner notification email
    if (data.cleaners?.email) {
      const email = cleanerRescheduleEmail(data, oldDate, oldTime)
      await sendEmail(data.cleaners.email, email.subject, email.html)
    }
    // Push notification to cleaner
    if (data.cleaner_id) {
      const newDate = new Date(body.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      sendPushToCleaner(data.cleaner_id, 'Job Rescheduled', `${data.clients?.name} moved to ${newDate}`, '/team/dashboard').catch(() => {})
    }
  } catch (emailError) {
    console.error('Reschedule email error:', emailError)
  }

  return NextResponse.json(data)
}
