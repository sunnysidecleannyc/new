import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateToken } from '@/lib/tokens'
import { sendEmail } from '@/lib/email'
import { clientConfirmationEmail, cleanerAssignmentEmail } from '@/lib/email-templates'
import { protectAdminAPI } from '@/lib/auth'
import { trackError } from '@/lib/error-tracking'
import { autoAttributeBooking } from '@/lib/attribution'

export async function POST(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const { bookings: bookingInputs } = await request.json()

  if (!Array.isArray(bookingInputs) || bookingInputs.length === 0) {
    return NextResponse.json({ error: 'bookings array required' }, { status: 400 })
  }

  // Build all rows with tokens
  const rows = bookingInputs.map((b: Record<string, unknown>) => {
    const token = generateToken()
    const tokenExpires = new Date(b.start_time as string)
    tokenExpires.setHours(tokenExpires.getHours() + 24)

    return {
      client_id: b.client_id,
      cleaner_id: b.cleaner_id || null,
      start_time: b.start_time,
      end_time: b.end_time,
      service_type: b.service_type,
      price: b.price,
      hourly_rate: b.hourly_rate || null,
      notes: b.notes || null,
      recurring_type: b.recurring_type || null,
      cleaner_token: token,
      token_expires_at: tokenExpires.toISOString(),
      status: (b.status as string) || 'scheduled',
      cleaner_pay_rate: b.cleaner_pay_rate || null,
    }
  })

  // Single batch insert
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert(rows)
    .select('*, clients(*), cleaners(*)')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send email only for the FIRST booking (the rest are recurring copies)
  const first = data[0]
  if (first && first.status !== 'pending') {
    try {
      if (first.clients?.email) {
        const email = clientConfirmationEmail(first)
        await sendEmail(first.clients.email, email.subject, email.html)
      }
      if (first.cleaners?.email) {
        const email = cleanerAssignmentEmail(first)
        await sendEmail(first.cleaners.email, email.subject, email.html)
      }
    } catch (emailError) {
      console.error('Batch email error:', emailError)
      await trackError(emailError, { source: 'api/bookings/batch', severity: 'high', extra: `Batch booking email failed` })
    }
  }

  // Auto-attribute first booking
  try {
    await autoAttributeBooking(first.id, first.client_id, first.created_at)
  } catch (attrErr) {
    console.error('Attribution error:', attrErr)
  }

  return NextResponse.json({ created: data.length, bookings: data })
}
