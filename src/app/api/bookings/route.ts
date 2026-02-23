import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateToken } from '@/lib/tokens'
import { sendEmail } from '@/lib/email'
import { clientConfirmationEmail, cleanerAssignmentEmail } from '@/lib/email-templates'
import { protectAdminAPI } from '@/lib/auth'
import { trackError } from '@/lib/error-tracking'
import { autoAttributeBooking } from '@/lib/attribution'

export async function GET() {
  // Protect admin route
  const authError = await protectAdminAPI()
  if (authError) return authError

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*, clients(*), cleaners(*)')
    .order('start_time', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  // Protect admin route
  const authError = await protectAdminAPI()
  if (authError) return authError

  const body = await request.json()
  const cleanerToken = generateToken()
  const tokenExpiresAt = new Date(body.start_time)
  tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24)

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert({
      client_id: body.client_id,
      cleaner_id: body.cleaner_id || null,
      start_time: body.start_time,
      end_time: body.end_time,
      service_type: body.service_type,
      price: body.price,
      hourly_rate: body.hourly_rate || null,
      notes: body.notes,
      recurring_type: body.recurring_type,
      cleaner_token: cleanerToken,
      token_expires_at: tokenExpiresAt.toISOString(),
      status: body.status || 'scheduled',
      cleaner_pay_rate: body.cleaner_pay_rate || null
    })
    .select('*, clients(*), cleaners(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send emails (skip for recurring bookings after the first, and skip for pending bookings)
  if (!body.skip_email && data.status !== 'pending') {
    try {
      if (data.clients?.email) {
        const clientEmail = clientConfirmationEmail(data)
        await sendEmail(data.clients.email, clientEmail.subject, clientEmail.html)
      }
      if (data.cleaners?.email) {
        const cleanerEmail = cleanerAssignmentEmail(data)
        await sendEmail(data.cleaners.email, cleanerEmail.subject, cleanerEmail.html)
      }
    } catch (emailError) {
      console.error('Email error:', emailError)
      await trackError(emailError, { source: 'api/bookings', severity: 'high', extra: `Booking ${data.id} email failed` })
    }
  }

  // Auto-attribute booking to lead source
  try {
    await autoAttributeBooking(data.id, data.client_id, data.created_at)
  } catch (attrErr) {
    console.error('Attribution error:', attrErr)
  }

  return NextResponse.json(data)
}
