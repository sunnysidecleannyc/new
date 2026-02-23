import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'
import { referralCommissionEmail } from '@/lib/email-templates'
import { geocodeAddress, calculateDistance, MAX_DISTANCE_MILES } from '@/lib/geo'
import { notify } from '@/lib/notify'
import { sendPushToClient } from '@/lib/push'

// Round up to nearest half hour: 2.25 → 2.5, 2.1 → 2.5, 2.75 → 3.0
const roundToHalfHour = (hours: number) => Math.ceil(hours * 2) / 2

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await request.json()

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('*, clients(*), cleaners(*)')
    .eq('cleaner_token', token)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  }

  // Calculate actual hours worked (rounded to half hour)
  const checkOutTime = new Date()
  const checkInTime = booking.check_in_time ? new Date(booking.check_in_time) : null
  let actualHours = null
  let cleanerPay = null
  let updatedPrice = booking.price // Keep original if no check-in

  if (checkInTime) {
    const rawHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)
    actualHours = roundToHalfHour(rawHours)

    // Calculate cleaner pay
    const cleanerRate = booking.cleaners?.hourly_rate || booking.cleaner_pay_rate || 25
    cleanerPay = Math.round(actualHours * cleanerRate * 100) // Store in cents

    // Recalculate client price based on actual hours
    const clientRate = booking.hourly_rate || 75
    updatedPrice = Math.round(actualHours * clientRate * 100) // Store in cents
  }

  // GPS verification
  let enrichedLocation = body.location || null
  let distanceInfo = ''
  let flagged = false

  if (body.location?.lat && body.location?.lng && booking.clients?.address) {
    try {
      const addressCoords = await geocodeAddress(booking.clients.address)
      if (addressCoords) {
        const distance = calculateDistance(
          body.location.lat, body.location.lng,
          addressCoords.lat, addressCoords.lng
        )
        flagged = distance > MAX_DISTANCE_MILES
        enrichedLocation = {
          ...body.location,
          distance_miles: Math.round(distance * 100) / 100,
          address_lat: addressCoords.lat,
          address_lng: addressCoords.lng,
          flagged
        }
        distanceInfo = ` • ${distance.toFixed(2)} mi from address`
        if (flagged) distanceInfo += ' ⚠️'
      }
    } catch (e) {
      console.error('GPS verification error:', e)
    }
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update({
      status: 'completed',
      check_out_time: checkOutTime.toISOString(),
      check_out_location: enrichedLocation,
      actual_hours: actualHours,
      cleaner_pay: cleanerPay,
      price: updatedPrice
    })
    .eq('id', booking.id)
    .select('*, clients(*), cleaners(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create single notification with all payment info
  const clientTotal = (updatedPrice / 100).toFixed(0)
  const cleanerPayAmount = cleanerPay ? (cleanerPay / 100).toFixed(2) : '0'

  const checkoutTitle = flagged ? `Job Done (GPS Mismatch): ${data.clients?.name}` : `Job Done: ${data.clients?.name}`
  await notify({ type: 'job_complete', title: checkoutTitle, message: `${actualHours}hrs by ${data.cleaners?.name} • Collect $${clientTotal} → Pay ${data.cleaners?.name} $${cleanerPayAmount}${distanceInfo}`, booking_id: data.id })

  // Push to client
  if (data.client_id) {
    sendPushToClient(data.client_id, 'Cleaning complete!', `${data.cleaners?.name} has finished your cleaning`, '/book/dashboard').catch(() => {})
  }

  // Send email notification to admin
  const cleanerRate = data.cleaners?.hourly_rate || booking.cleaner_pay_rate || 25
  const clientRate = data.hourly_rate || 75
  const jobCompleteEmail = `
    <div style="font-family: sans-serif; max-width: 500px;">
      <div style="background: #16a34a; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 22px;">Job Complete</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 18px; font-weight: bold; margin: 0 0 15px 0;">${data.clients?.name}</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Cleaner</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 500;">${data.cleaners?.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Hours Worked</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 500;">${actualHours} hrs</td>
          </tr>
          <tr style="border-top: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #666;">Client Rate</td>
            <td style="padding: 12px 0; text-align: right;">$${clientRate}/hr</td>
          </tr>
          <tr style="background: #f0fdf4;">
            <td style="padding: 12px 8px; font-weight: bold; color: #16a34a;">COLLECT FROM CLIENT</td>
            <td style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 20px; color: #16a34a;">$${clientTotal}</td>
          </tr>
          <tr style="border-top: 1px solid #e5e7eb;">
            <td style="padding: 12px 0; color: #666;">Team Rate</td>
            <td style="padding: 12px 0; text-align: right;">$${cleanerRate}/hr</td>
          </tr>
          <tr style="background: #fef3c7;">
            <td style="padding: 12px 8px; font-weight: bold; color: #d97706;">PAY ${data.cleaners?.name?.toUpperCase()}</td>
            <td style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 20px; color: #d97706;">$${cleanerPayAmount}</td>
          </tr>
        </table>
        ${flagged ? `<tr style="background: #fef2f2;"><td style="padding: 12px 8px; font-weight: bold; color: #dc2626;" colspan="2">⚠️ GPS MISMATCH: Checked out ${enrichedLocation?.distance_miles?.toFixed(2) || '?'} mi from client address</td></tr>` : enrichedLocation?.distance_miles !== undefined ? `<tr><td style="padding: 8px 0; color: #666;">GPS Distance</td><td style="padding: 8px 0; text-align: right; font-weight: 500;">${enrichedLocation.distance_miles.toFixed(2)} mi ✓</td></tr>` : ''}
        ${data.clients?.phone ? `<p style="margin-top: 20px;"><a href="tel:${data.clients.phone}" style="color: #2563eb;">Call ${data.clients.name}</a></p>` : ''}
      </div>
    </div>
  `
  if (process.env.ADMIN_EMAIL) {
    await sendEmail(process.env.ADMIN_EMAIL, `Job Done: ${data.clients?.name} • Collect $${clientTotal} → Pay $${cleanerPayAmount}`, jobCompleteEmail)
  }

  // ===== REFERRAL COMMISSION =====
  // Check if client has a referrer
  if (data.clients?.referrer_id) {
    try {
      // Check if commission already exists for this booking
      const { data: existingCommission } = await supabaseAdmin
        .from('referral_commissions')
        .select('id')
        .eq('booking_id', data.id)
        .single()

      if (!existingCommission) {
        // Calculate commission (10% of price)
        const grossAmount = data.price || 0
        const commissionRate = 0.10
        const commissionAmount = Math.round(grossAmount * commissionRate)

        // Create commission record
        await supabaseAdmin
          .from('referral_commissions')
          .insert({
            booking_id: data.id,
            referrer_id: data.clients.referrer_id,
            client_name: data.clients?.name || 'Unknown',
            gross_amount: grossAmount,
            commission_rate: commissionRate,
            commission_amount: commissionAmount,
            status: 'pending'
          })

        // Get referrer details and update their total_earned
        const { data: ref } = await supabaseAdmin
          .from('referrers')
          .select('*')
          .eq('id', data.clients.referrer_id)
          .single()

        if (ref) {
          // Update total earned
          await supabaseAdmin
            .from('referrers')
            .update({ total_earned: (ref.total_earned || 0) + commissionAmount })
            .eq('id', ref.id)

          // Send email notification to referrer
          const commissionEmail = referralCommissionEmail(ref, data, commissionAmount)
          await sendEmail(ref.email, commissionEmail.subject, commissionEmail.html)

          // Create notification for admin
          await supabaseAdmin.from('notifications').insert({
            type: 'referral_commission',
            title: 'Referral Commission Created',
            message: `${ref.name} earned $${(commissionAmount / 100).toFixed(2)} from ${data.clients?.name}'s cleaning • by ${data.cleaners?.name}`,
            booking_id: data.id
          })
        }
      }
    } catch (commErr) {
      console.error('Commission creation error:', commErr)
      // Don't fail checkout if commission fails
    }
  }

  return NextResponse.json(data)
}
