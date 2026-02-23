import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { clientConfirmationEmail, cleanerAssignmentEmail, cleanerWelcomeEmail } from '@/lib/email-templates'

export async function POST(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const body = await request.json()
  
  // Handle cleaner welcome email
  if (body.type === 'cleaner-welcome' && body.cleaner) {
    const { cleaner } = body
    if (!cleaner.email) return NextResponse.json({ error: 'No email' }, { status: 400 })
    const email = cleanerWelcomeEmail(cleaner)
    const result = await sendEmail(cleaner.email, email.subject, email.html)
    return NextResponse.json({ success: true, result })
  }
  
  // Handle booking emails
  const { bookingId, clientOnly } = body
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('*, clients(*), cleaners(*)')
    .eq('id', bookingId)
    .single()
  if (error || !booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  const results = []
  if (booking.clients?.email) {
    const clientEmail = clientConfirmationEmail(booking)
    const result = await sendEmail(booking.clients.email, clientEmail.subject, clientEmail.html)
    results.push({ type: 'client_confirmation', ...result })
    await supabaseAdmin.from('email_logs').insert({ booking_id: bookingId, email_type: 'confirmation', recipient: booking.clients.email })
  }
  if (!clientOnly && booking.cleaners?.email) {
    const cleanerEmail = cleanerAssignmentEmail(booking)
    const result = await sendEmail(booking.cleaners.email, cleanerEmail.subject, cleanerEmail.html)
    results.push({ type: 'cleaner_assignment', ...result })
    await supabaseAdmin.from('email_logs').insert({ booking_id: bookingId, email_type: 'assignment', recipient: booking.cleaners.email })
  }
  return NextResponse.json({ success: true, results })
}
