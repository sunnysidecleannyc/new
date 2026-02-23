import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'
import { protectAdminAPI } from '@/lib/auth'
import { sendPushToAllCleaners } from '@/lib/push'

// POST - Broadcast an available job to all active cleaners
export async function POST(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const body = await request.json()
  const { booking_id } = body

  if (!booking_id) {
    return NextResponse.json({ error: 'Missing booking_id' }, { status: 400 })
  }

  // Get the booking
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('*, clients(*)')
    .eq('id', booking_id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Get all active cleaners with email
  const { data: cleaners } = await supabaseAdmin
    .from('cleaners')
    .select('*')
    .eq('active', true)
    .not('email', 'is', null)

  if (!cleaners || cleaners.length === 0) {
    return NextResponse.json({ error: 'No active cleaners with email' }, { status: 400 })
  }

  const jobDate = new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const jobTime = new Date(booking.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const endTime = new Date(booking.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const hours = Math.round((new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / (1000 * 60 * 60))
  const payRate = booking.cleaner_pay_rate || 40

  // Send email + SMS to all cleaners
  let sentCount = 0
  for (const cleaner of cleaners) {
    if (cleaner.email) {
      const html = `
        <div style="font-family: sans-serif; max-width: 500px;">
          <div style="background: #dc2626; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🚨 URGENT JOB AVAILABLE</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">First to claim gets it!</p>
          </div>
          <div style="background: #fef2f2; padding: 20px; border: 2px solid #fecaca;">
            <p style="font-size: 28px; font-weight: bold; color: #16a34a; margin: 0 0 10px 0;">$${payRate}/hr</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${jobDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${jobTime} - ${endTime} (~${hours}hrs)</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${booking.clients?.address || 'TBD'}</p>
            <p style="margin: 5px 0;"><strong>Service:</strong> ${booking.service_type}</p>
            ${booking.notes ? `<p style="margin: 10px 0; padding: 10px; background: #fef9c3; border-radius: 6px;"><strong>Notes:</strong> ${booking.notes}</p>` : ''}
          </div>
          <div style="padding: 20px; text-align: center;">
            <a href="https://www.thenycmaid.com/team" style="display: inline-block; background: #dc2626; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
              🙋 CLAIM NOW / RECLAMAR
            </a>
            <p style="margin-top: 15px; color: #666; font-size: 14px;">
              Log in to your team portal to claim this job<br/>
              Inicia sesión en tu portal para reclamar
            </p>
          </div>
        </div>
      `
      try {
        await sendEmail(cleaner.email, `🚨 URGENT: $${payRate}/hr Job Available - ${jobDate}`, html)
        sentCount++
      } catch (e) {
        console.error(`Failed to email ${cleaner.email}:`, e)
      }
    }
  }

  // Push notification to all cleaners
  sendPushToAllCleaners(
    `Urgent: $${payRate}/hr Job Available`,
    `${jobDate} ${jobTime} - ${endTime}`,
    '/team/dashboard'
  ).catch(() => {})

  // Create notification
  await supabaseAdmin.from('notifications').insert({
    type: 'job_broadcast',
    title: 'Job Broadcast Sent',
    message: `Available job sent to ${sentCount} team members`
  })

  return NextResponse.json({ success: true, sentTo: sentCount })
}
