import { supabaseAdmin } from '@/lib/supabase'

export interface AvailabilitySlot {
  time: string
  available: boolean
}

export interface AvailabilityResult {
  slots: AvailabilitySlot[]
  sameDay?: boolean
  message?: string
}

const TZ = 'America/New_York'
const TIME_LABELS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']

export async function checkAvailability(date: string): Promise<AvailabilityResult> {
  // Check if same day (use ET, not UTC — server might be in UTC)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ })
  if (date === today) {
    return { slots: [], sameDay: true, message: 'Same-day bookings require confirmation' }
  }

  const dayOfWeek = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })

  // Get ALL active cleaners
  const { data: allCleaners } = await supabaseAdmin
    .from('cleaners')
    .select('*')
    .eq('active', true)

  if (!allCleaners || allCleaners.length === 0) {
    return { slots: [], message: 'No active cleaners' }
  }

  // Filter to those who work this day and aren't on a day off
  const cleaners = allCleaners.filter(c => {
    // Check day-off list first
    if (c.unavailable_dates && Array.isArray(c.unavailable_dates) && c.unavailable_dates.includes(date)) {
      return false
    }
    // If working_days is set AND non-empty, check it
    if (c.working_days && Array.isArray(c.working_days) && c.working_days.length > 0) {
      return c.working_days.includes(dayOfWeek)
    }
    // If schedule is set AND has entries, check it
    if (c.schedule && typeof c.schedule === 'object' && Object.keys(c.schedule).length > 0) {
      return c.schedule[dayOfWeek] !== null && c.schedule[dayOfWeek] !== undefined
    }
    // No restrictions set — default to available Mon-Sat
    return dayOfWeek !== 'Sun'
  })

  if (cleaners.length === 0) {
    return { slots: [], message: 'No cleaners available on ' + dayOfWeek }
  }

  // Query bookings using naive timestamps (bookings stored as naive timestamp, no tz)
  const startOfDay = date + 'T00:00:00'
  const endOfDay = date + 'T23:59:59'

  const { data: existingBookings } = await supabaseAdmin
    .from('bookings')
    .select('cleaner_id, start_time, end_time')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .neq('status', 'cancelled')

  // Parse naive time string to minutes since midnight for comparison
  const toMinutes = (timeStr: string) => {
    const timePart = timeStr.split('T')[1] || '00:00'
    const [h, m] = timePart.split(':').map(Number)
    return h * 60 + m
  }

  const slots: AvailabilitySlot[] = []

  for (let hour = 9; hour <= 16; hour++) {
    const slotStartMin = hour * 60
    const slotEndMin = slotStartMin + 120 // 2-hour slot

    const hasAvailableCleaner = cleaners.some(cleaner => {
      const hasConflict = (existingBookings || []).some(booking => {
        if (booking.cleaner_id !== cleaner.id) return false
        const bookingStartMin = toMinutes(booking.start_time)
        const bookingEndMin = toMinutes(booking.end_time)
        const bufferMin = 90
        const bufferStart = bookingStartMin - bufferMin
        const bufferEnd = bookingEndMin + bufferMin
        return slotStartMin < bufferEnd && slotEndMin > bufferStart
      })
      return !hasConflict
    })

    slots.push({ time: TIME_LABELS[hour - 9], available: hasAvailableCleaner })
  }

  return { slots }
}
