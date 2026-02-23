import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'

// Round up to nearest half hour
const roundToHalfHour = (hours: number) => Math.ceil(hours * 2) / 2

export async function POST() {
  const authError = await protectAdminAPI()
  if (authError) return authError

  // Get completed bookings missing cleaner_pay
  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('id, start_time, end_time, cleaner_id, hourly_rate, check_in_time, check_out_time, cleaners(hourly_rate)')
    .eq('status', 'completed')
    .is('cleaner_pay', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let updated = 0
  for (const booking of bookings || []) {
    // Calculate hours - prefer actual check in/out, fallback to scheduled
    let hours: number
    if (booking.check_in_time && booking.check_out_time) {
      const checkIn = new Date(booking.check_in_time)
      const checkOut = new Date(booking.check_out_time)
      hours = roundToHalfHour((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60))
    } else {
      const start = new Date(booking.start_time)
      const end = new Date(booking.end_time)
      hours = roundToHalfHour((end.getTime() - start.getTime()) / (1000 * 60 * 60))
    }

    // Get cleaner rate
    const cleaner = booking.cleaners as unknown as { hourly_rate: number } | null
    const cleanerRate = cleaner?.hourly_rate || 25

    // Calculate pay
    const cleanerPay = Math.round(hours * cleanerRate * 100)

    // Also recalculate client price if missing hourly_rate
    const clientRate = booking.hourly_rate || 75
    const clientPrice = Math.round(hours * clientRate * 100)

    // Update booking
    await supabaseAdmin
      .from('bookings')
      .update({
        actual_hours: hours,
        cleaner_pay: cleanerPay,
        price: clientPrice
      })
      .eq('id', booking.id)

    updated++
  }

  return NextResponse.json({ success: true, updated })
}
