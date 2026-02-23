import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'
import { clientConfirmationEmail, cleanerAssignmentEmail, clientCancellationEmail, cleanerCancellationEmail, cleanerRescheduleEmail } from '@/lib/email-templates'
import { protectAdminAPI } from '@/lib/auth'
import { trackError } from '@/lib/error-tracking'
import { sendPushToCleaner, sendPushToClient } from '@/lib/push'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Protect admin route
  const authError = await protectAdminAPI()
  if (authError) return authError

  const { id } = await params
  const body = await request.json()

  // Log for debugging UUID issue
  console.log('BOOKING UPDATE DEBUG:', { id, cleaner_id: body.cleaner_id, keys: Object.keys(body) })

  // Validate booking ID
  if (!id || id === 'undefined') {
    return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 })
  }

  // Get old booking to detect status and date/time changes
  const { data: oldBooking } = await supabaseAdmin
    .from('bookings')
    .select('status, start_time, end_time')
    .eq('id', id)
    .single()

  const updatePayload: Record<string, unknown> = {
    status: body.status,
    payment_status: body.payment_status,
    payment_method: body.payment_method || null,
    notes: body.notes || null,
    cleaner_id: (body.cleaner_id && body.cleaner_id !== 'undefined') ? body.cleaner_id : null
  }
  if (body.start_time) updatePayload.start_time = body.start_time
  if (body.end_time) updatePayload.end_time = body.end_time
  if (body.price !== undefined) updatePayload.price = body.price
  if (body.service_type) updatePayload.service_type = body.service_type
  if (body.hourly_rate !== undefined) updatePayload.hourly_rate = body.hourly_rate
  if (body.recurring_type !== undefined) updatePayload.recurring_type = body.recurring_type
  if (body.check_in_time) updatePayload.check_in_time = body.check_in_time
  if (body.check_out_time) updatePayload.check_out_time = body.check_out_time
  if (body.actual_hours !== undefined) updatePayload.actual_hours = body.actual_hours
  if (body.cleaner_pay !== undefined) updatePayload.cleaner_pay = body.cleaner_pay
  if (body.cleaner_paid !== undefined) {
    updatePayload.cleaner_paid = body.cleaner_paid
    updatePayload.cleaner_paid_at = body.cleaner_paid ? new Date().toISOString() : null
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update(updatePayload)
    .eq('id', id)
    .select('*, clients(*), cleaners(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notification: booking confirmed
  if (oldBooking?.status === 'pending' && body.status === 'scheduled') {
    const bookingDateStr = new Date(data.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    await supabaseAdmin.from('notifications').insert({
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      message: `${data.clients?.name} - ${bookingDateStr} • ${data.cleaners?.name || 'Unassigned'}`,
      booking_id: id
    })
  }

  // Notification: admin check-in
  if (oldBooking?.status !== 'in_progress' && body.status === 'in_progress' && body.check_in_time) {
    await supabaseAdmin.from('notifications').insert({
      type: 'check_in',
      title: 'Job Started',
      message: `${data.clients?.name} - ${data.cleaners?.name || 'Unassigned'} • Admin check-in`,
      booking_id: id
    })
  }

  // Send confirmation emails when booking moves from pending → scheduled
  if (oldBooking?.status === 'pending' && body.status === 'scheduled' && !body.skip_email) {
    try {
      if (data.clients?.email) {
        const email = clientConfirmationEmail(data)
        await sendEmail(data.clients.email, email.subject, email.html)
        await supabaseAdmin.from('email_logs').insert({ booking_id: id, email_type: 'confirmation', recipient: data.clients.email })
      }
      if (data.cleaners?.email) {
        const email = cleanerAssignmentEmail(data)
        await sendEmail(data.cleaners.email, email.subject, email.html)
        await supabaseAdmin.from('email_logs').insert({ booking_id: id, email_type: 'assignment', recipient: data.cleaners.email })
      }
      // Push notifications
      const bookingDate = new Date(data.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      if (data.client_id) {
        sendPushToClient(data.client_id, 'Booking Confirmed', `Your cleaning on ${bookingDate} is confirmed`, '/book/dashboard').catch(() => {})
      }
      if (data.cleaner_id) {
        sendPushToCleaner(data.cleaner_id, 'New Job Assigned', `${data.clients?.name} on ${bookingDate}`, '/team/dashboard').catch(() => {})
      }
    } catch (emailError) {
      console.error('Confirmation email error:', emailError)
      await trackError(emailError, { source: 'api/bookings/update', severity: 'high', extra: `Booking ${id} confirmation email failed` })
    }
  }

  // Notification + emails when date/time changes (not during pending→scheduled, not during check-in/out)
  const dateTimeChanged = oldBooking && body.start_time &&
    (oldBooking.start_time !== body.start_time || oldBooking.end_time !== body.end_time) &&
    !(oldBooking.status === 'pending' && body.status === 'scheduled') &&
    !body.check_in_time && !body.check_out_time && !body.skip_email
  if (dateTimeChanged) {
    // Parse old date/time for display
    const [oldDatePart, oldTimePart] = oldBooking.start_time.split('T')
    const [oy, om, od] = oldDatePart.split('-').map(Number)
    const [oh, omin] = (oldTimePart || '00:00').split(':').map(Number)
    const oldDateObj = new Date(oy, om - 1, od, oh, omin)
    const oldDateStr = oldDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    const oldTimeStr = oldDateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

    const [newDatePart, newTimePart] = data.start_time.split('T')
    const [ny, nm, nd] = newDatePart.split('-').map(Number)
    const [nh, nmin] = (newTimePart || '00:00').split(':').map(Number)
    const newDateObj = new Date(ny, nm - 1, nd, nh, nmin)
    const newDateStr = newDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    const newTimeStr = newDateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

    // Dashboard notification
    await supabaseAdmin.from('notifications').insert({
      type: 'booking_rescheduled',
      title: 'Booking Rescheduled',
      message: `${data.clients?.name} moved from ${oldDateStr} ${oldTimeStr} → ${newDateStr} ${newTimeStr}`,
      booking_id: id
    })

    // Emails + SMS
    try {
      // No client email on reschedule — admin can resend manually if needed
      if (data.cleaners?.email) {
        const email = cleanerRescheduleEmail(data, oldDateStr, oldTimeStr)
        await sendEmail(data.cleaners.email, email.subject, email.html)
        await supabaseAdmin.from('email_logs').insert({ booking_id: id, email_type: 'reschedule', recipient: data.cleaners.email })
      }
      // Push notifications
      const pushDate = newDateStr + ' at ' + newTimeStr
      if (data.cleaner_id) {
        sendPushToCleaner(data.cleaner_id, 'Job Rescheduled', `${data.clients?.name} moved to ${pushDate}`, '/team/dashboard').catch(() => {})
      }
    } catch (emailError) {
      console.error('Reschedule email error:', emailError)
      await trackError(emailError, { source: 'api/bookings/update', severity: 'high', extra: `Booking ${id} reschedule email failed` })
    }
  }

  if (body.status === 'completed') {
    await supabaseAdmin.from('notifications').insert({
      type: 'check_out',
      title: 'Job Completed',
      message: `${data.clients?.name} - ${data.cleaners?.name} • by Admin`,
      booking_id: id
    })
  }

  if (body.payment_status === 'paid' && body.payment_method) {
    await supabaseAdmin.from('notifications').insert({
      type: 'payment_received',
      title: 'Payment Received',
      message: `${data.clients?.name} - $${(data.price / 100).toFixed(0)} via ${body.payment_method} • by Admin`,
      booking_id: id
    })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Protect admin route
  const authError = await protectAdminAPI()
  if (authError) return authError

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const hardDelete = searchParams.get('hard_delete') === 'true'
  const skipEmail = searchParams.get('skip_email') === 'true'

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('*, clients(*), cleaners(*)')
    .eq('id', id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Hard delete: permanently remove cancelled bookings
  if (hardDelete && booking.status === 'cancelled') {
    // Remove related records first (foreign key constraints)
    await supabaseAdmin.from('notifications').delete().eq('booking_id', id)
    await supabaseAdmin.from('email_logs').delete().eq('booking_id', id)

    const { error } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Hard delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, deleted: true })
  }

  // Soft delete: set status to cancelled
  const { error } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const bookingDate = new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  await supabaseAdmin.from('notifications').insert({
    type: 'booking_cancelled',
    title: 'Booking Cancelled',
    message: `${booking.clients?.name} - ${bookingDate} • by Admin`,
    booking_id: id
  })

  // Send cancellation emails + SMS (skip for batch recurring cancellations)
  if (!skipEmail) {
    try {
      if (booking.clients?.email) {
        const clientEmail = clientCancellationEmail(booking)
        sendEmail(booking.clients.email, clientEmail.subject, clientEmail.html)
        supabaseAdmin.from('email_logs').insert({ booking_id: id, email_type: 'cancellation', recipient: booking.clients.email })
      }
      if (booking.cleaners?.email) {
        const cleanerEmail = cleanerCancellationEmail(booking)
        sendEmail(booking.cleaners.email, cleanerEmail.subject, cleanerEmail.html)
        supabaseAdmin.from('email_logs').insert({ booking_id: id, email_type: 'cancellation', recipient: booking.cleaners.email })
      }
      // Push notifications
      if (booking.client_id) {
        sendPushToClient(booking.client_id, 'Booking Cancelled', `Your cleaning on ${bookingDate} has been cancelled`, '/book/dashboard').catch(() => {})
      }
      if (booking.cleaner_id) {
        sendPushToCleaner(booking.cleaner_id, 'Job Cancelled', `${booking.clients?.name} on ${bookingDate}`, '/team/dashboard').catch(() => {})
      }
    } catch (e) {
      console.error('Cancellation email error:', e)
      await trackError(e, { source: 'api/bookings/delete', severity: 'high', extra: `Booking ${id} cancellation email failed` })
    }
  }

  return NextResponse.json({ success: true, cancelled: true })
}
