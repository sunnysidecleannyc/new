import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'

export async function GET() {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const fourteenDaysOut = new Date(endOfDay.getTime() + 14 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59)

  // Live statuses only (no pending)
  const liveStatuses = ['confirmed', 'scheduled', 'in_progress']

  // Today's jobs (for the feed)
  const { data: today } = await supabaseAdmin
    .from('bookings')
    .select('*, clients(*), cleaners(*)')
    .gte('start_time', startOfDay.toISOString())
    .lt('start_time', endOfDay.toISOString())
    .in('status', [...liveStatuses, 'completed'])
    .order('start_time')

  // Map jobs - Today
  const { data: mapToday } = await supabaseAdmin
    .from('bookings')
    .select('id, start_time, status, service_type, cleaner_id, clients(name, address), cleaners(name)')
    .gte('start_time', startOfDay.toISOString())
    .lt('start_time', endOfDay.toISOString())
    .in('status', [...liveStatuses, 'completed'])

  // Map jobs - Week
  const { data: mapWeek } = await supabaseAdmin
    .from('bookings')
    .select('id, start_time, status, service_type, cleaner_id, clients(name, address), cleaners(name)')
    .gte('start_time', startOfWeek.toISOString())
    .lt('start_time', endOfWeek.toISOString())
    .in('status', [...liveStatuses, 'completed'])

  // Map jobs - Month
  const { data: mapMonth } = await supabaseAdmin
    .from('bookings')
    .select('id, start_time, status, service_type, cleaner_id, clients(name, address), cleaners(name)')
    .gte('start_time', startOfMonth.toISOString())
    .lte('start_time', endOfMonth.toISOString())
    .in('status', [...liveStatuses, 'completed'])

  // All jobs (for projected revenue and modals) - fetch through end of year for projections
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const { data: allJobs } = await supabaseAdmin
    .from('bookings')
    .select('*, clients(*), cleaners(*)')
    .gte('start_time', startOfYear.toISOString())
    .lte('start_time', endOfYear.toISOString())
    .order('start_time')

  // Pending payment
  const { data: pendingPayment } = await supabaseAdmin
    .from('bookings')
    .select('price')
    .eq('status', 'completed')
    .eq('payment_status', 'pending')

  // Upcoming 14 days (live only)
  const { data: upcoming } = await supabaseAdmin
    .from('bookings')
    .select('*, clients(*), cleaners(*)')
    .gte('start_time', startOfDay.toISOString())
    .lt('start_time', fourteenDaysOut.toISOString())
    .in('status', liveStatuses)
    .order('start_time')

  // All clients
  const { data: allClients } = await supabaseAdmin
    .from('clients')
    .select('id')

  // Recent clients
  const { data: recentClients } = await supabaseAdmin
    .from('clients')
    .select('*')
    .gte('created_at', startOfMonth.toISOString())

  // Completed last 30 days
  const { data: completedRecent } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('status', 'completed')
    .gte('start_time', thirtyDaysAgo.toISOString())

  // Scheduled count (live only, no pending, this year only)
  const { data: scheduledAll } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .in('status', liveStatuses)
    .gte('start_time', startOfDay.toISOString())
    .lte('start_time', endOfYear.toISOString())

  // Financials - completed & paid only
  const { data: todayPaid } = await supabaseAdmin
    .from('bookings')
    .select('price')
    .gte('start_time', startOfDay.toISOString())
    .lt('start_time', endOfDay.toISOString())
    .eq('status', 'completed')
    .eq('payment_status', 'paid')

  const { data: weekPaid } = await supabaseAdmin
    .from('bookings')
    .select('price')
    .gte('start_time', startOfWeek.toISOString())
    .lt('start_time', endOfWeek.toISOString())
    .eq('status', 'completed')
    .eq('payment_status', 'paid')

  const { data: monthPaid } = await supabaseAdmin
    .from('bookings')
    .select('price')
    .gte('start_time', startOfMonth.toISOString())
    .lte('start_time', endOfMonth.toISOString())
    .eq('status', 'completed')
    .eq('payment_status', 'paid')

  const calcRevenue = (jobs: any[] | null) => (jobs || []).reduce((sum, b) => sum + (b.price || 0), 0)

  // Get cleaners for filter dropdown
  const { data: cleanersList } = await supabaseAdmin
    .from('cleaners')
    .select('id, name')
    .eq('active', true)
    .order('name')

  // Normalize status for map jobs
  const normalizeMapJobs = (jobs: any[] | null) => (jobs || []).map(j => ({
    ...j,
    status: ['confirmed'].includes(j.status) ? 'scheduled' : j.status
  }))

  return NextResponse.json({
    todayJobs: today || [],
    upcomingBookings: upcoming || [],
    allJobs: allJobs || [],
    mapJobs: {
      today: normalizeMapJobs(mapToday),
      week: normalizeMapJobs(mapWeek),
      month: normalizeMapJobs(mapMonth)
    },
    financials: {
      today: { revenue: calcRevenue(todayPaid), jobs: todayPaid?.length || 0 },
      week: { revenue: calcRevenue(weekPaid), jobs: weekPaid?.length || 0 },
      month: { revenue: calcRevenue(monthPaid), jobs: monthPaid?.length || 0 },
      pending: { revenue: calcRevenue(pendingPayment), jobs: pendingPayment?.length || 0 }
    },
    clients: {
      total: allClients?.length || 0,
      newThisMonth: recentClients?.length || 0
    },
    stats: {
      scheduled: scheduledAll?.length || 0,
      completed: completedRecent?.length || 0,
      pending_payment: pendingPayment?.length || 0
    },
    cleaners: cleanersList || []
  })
}
