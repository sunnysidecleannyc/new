import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Round up to nearest half hour: 2.25 → 2.5, 2.1 → 2.5, 2.75 → 3.0
const roundToHalfHour = (hours: number) => Math.ceil(hours * 2) / 2

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cleanerId = searchParams.get('cleaner_id')

  if (!cleanerId) {
    return NextResponse.json({ error: 'Missing cleaner_id' }, { status: 400 })
  }

  // Get cleaner's hourly rate
  const { data: cleaner } = await supabaseAdmin
    .from('cleaners')
    .select('hourly_rate')
    .eq('id', cleanerId)
    .single()

  const hourlyRate = cleaner?.hourly_rate || 25

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  // Get today's jobs
  const { data: todayJobs } = await supabaseAdmin
    .from('bookings')
    .select('id, start_time, end_time, service_type, notes, status, check_in_time, check_out_time, cleaner_token, clients(name, phone, address, notes)')
    .eq('cleaner_id', cleanerId)
    .gte('start_time', todayStart.toISOString())
    .lt('start_time', todayEnd.toISOString())
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true })

  // Get upcoming jobs (next 14 days)
  const futureEnd = new Date(todayEnd.getTime() + 14 * 24 * 60 * 60 * 1000)

  const { data: upcomingJobs } = await supabaseAdmin
    .from('bookings')
    .select('id, start_time, end_time, service_type, notes, status, check_in_time, check_out_time, cleaner_token, clients(name, phone, address, notes)')
    .eq('cleaner_id', cleanerId)
    .gte('start_time', todayEnd.toISOString())
    .lt('start_time', futureEnd.toISOString())
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true })

  // Get completed jobs this week for earnings (Mon-Sun)
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() + mondayOffset)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const { data: weekJobs } = await supabaseAdmin
    .from('bookings')
    .select('cleaner_pay, actual_hours, check_in_time, check_out_time, start_time')
    .eq('cleaner_id', cleanerId)
    .eq('status', 'completed')
    .gte('start_time', weekStart.toISOString())
    .lt('start_time', weekEnd.toISOString())

  // Calculate weekly earnings from cleaner_pay (source of truth), with hours from actual_hours or check-in/check-out
  let weeklyPay = 0
  let weeklyHours = 0
  for (const job of weekJobs || []) {
    weeklyPay += job.cleaner_pay || 0
    if (job.actual_hours) {
      weeklyHours += job.actual_hours
    } else if (job.check_in_time && job.check_out_time) {
      const rawHours = (new Date(job.check_out_time).getTime() - new Date(job.check_in_time).getTime()) / (1000 * 60 * 60)
      weeklyHours += roundToHalfHour(rawHours)
    }
  }

  // Get month earnings
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const { data: monthJobs } = await supabaseAdmin
    .from('bookings')
    .select('cleaner_pay, actual_hours, check_in_time, check_out_time')
    .eq('cleaner_id', cleanerId)
    .eq('status', 'completed')
    .gte('start_time', monthStart.toISOString())
    .lte('start_time', monthEnd.toISOString())

  let monthlyPay = 0
  let monthlyHours = 0
  for (const job of monthJobs || []) {
    monthlyPay += job.cleaner_pay || 0
    if (job.actual_hours) {
      monthlyHours += job.actual_hours
    } else if (job.check_in_time && job.check_out_time) {
      const rawHours = (new Date(job.check_out_time).getTime() - new Date(job.check_in_time).getTime()) / (1000 * 60 * 60)
      monthlyHours += roundToHalfHour(rawHours)
    }
  }

  // Get year-to-date earnings
  const yearStart = new Date(now.getFullYear(), 0, 1)

  const { data: yearJobs } = await supabaseAdmin
    .from('bookings')
    .select('cleaner_pay, actual_hours, check_in_time, check_out_time')
    .eq('cleaner_id', cleanerId)
    .eq('status', 'completed')
    .gte('start_time', yearStart.toISOString())
    .lte('start_time', now.toISOString())

  let yearlyPay = 0
  let yearlyHours = 0
  for (const job of yearJobs || []) {
    yearlyPay += job.cleaner_pay || 0
    if (job.actual_hours) {
      yearlyHours += job.actual_hours
    } else if (job.check_in_time && job.check_out_time) {
      const rawHours = (new Date(job.check_out_time).getTime() - new Date(job.check_in_time).getTime()) / (1000 * 60 * 60)
      yearlyHours += roundToHalfHour(rawHours)
    }
  }

  // Calculate today's potential earnings (scheduled hours for today)
  let todayPotentialHours = 0
  for (const job of todayJobs || []) {
    const start = new Date(job.start_time)
    const end = new Date(job.end_time)
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    todayPotentialHours += hours
  }

  return NextResponse.json({
    today: todayJobs || [],
    upcoming: upcomingJobs || [],
    earnings: {
      hourlyRate,
      todayPotentialHours: Math.round(todayPotentialHours * 10) / 10,
      todayPotentialPay: Math.round(todayPotentialHours * hourlyRate * 100) / 100,
      weeklyHours: Math.round(weeklyHours * 10) / 10,
      weeklyPay: weeklyPay / 100,
      monthlyHours: Math.round(monthlyHours * 10) / 10,
      monthlyPay: monthlyPay / 100,
      yearlyHours: Math.round(yearlyHours * 10) / 10,
      yearlyPay: yearlyPay / 100,
      weekJobsCount: weekJobs?.length || 0,
      monthJobsCount: monthJobs?.length || 0,
      yearJobsCount: yearJobs?.length || 0
    }
  })
}
