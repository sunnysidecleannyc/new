import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'

export async function GET() {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const now = new Date()

  // Week boundaries (Mon-Sun)
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  // Month boundaries
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  // Year boundaries
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59)

  // Get completed bookings for each period
  const { data: weekBookings } = await supabaseAdmin
    .from('bookings')
    .select('price, cleaner_pay, cleaner_paid')
    .eq('status', 'completed')
    .gte('start_time', weekStart.toISOString())
    .lt('start_time', weekEnd.toISOString())

  const { data: monthBookings } = await supabaseAdmin
    .from('bookings')
    .select('price, cleaner_pay, cleaner_paid')
    .eq('status', 'completed')
    .gte('start_time', monthStart.toISOString())
    .lte('start_time', monthEnd.toISOString())

  const { data: yearBookings } = await supabaseAdmin
    .from('bookings')
    .select('price, cleaner_pay, cleaner_paid')
    .eq('status', 'completed')
    .gte('start_time', yearStart.toISOString())
    .lte('start_time', yearEnd.toISOString())

  // Get pending payments (completed but not paid)
  const { data: pendingBookings } = await supabaseAdmin
    .from('bookings')
    .select('price, cleaner_pay, payment_status, cleaner_paid')
    .eq('status', 'completed')
    .or('payment_status.neq.paid,cleaner_paid.neq.true')

  // Get recent payment history (completed + paid cleaners)
  const { data: recentPayments } = await supabaseAdmin
    .from('bookings')
    .select('id, cleaner_paid_at, cleaner_pay, actual_hours, start_time, clients(name), cleaners(name)')
    .eq('status', 'completed')
    .eq('cleaner_paid', true)
    .not('cleaner_paid_at', 'is', null)
    .order('cleaner_paid_at', { ascending: false })
    .limit(20)

  // Calculate totals
  const weekRevenue = (weekBookings || []).reduce((sum, b) => sum + (b.price || 0), 0)
  const weekLabor = (weekBookings || []).reduce((sum, b) => sum + (b.cleaner_pay || 0), 0)
  const weekLaborPaid = (weekBookings || []).filter(b => b.cleaner_paid).reduce((sum, b) => sum + (b.cleaner_pay || 0), 0)
  const weekLaborOwed = weekLabor - weekLaborPaid

  const monthRevenue = (monthBookings || []).reduce((sum, b) => sum + (b.price || 0), 0)
  const monthLabor = (monthBookings || []).reduce((sum, b) => sum + (b.cleaner_pay || 0), 0)
  const monthLaborPaid = (monthBookings || []).filter(b => b.cleaner_paid).reduce((sum, b) => sum + (b.cleaner_pay || 0), 0)
  const monthLaborOwed = monthLabor - monthLaborPaid

  const yearRevenue = (yearBookings || []).reduce((sum, b) => sum + (b.price || 0), 0)
  const yearLabor = (yearBookings || []).reduce((sum, b) => sum + (b.cleaner_pay || 0), 0)
  const yearLaborPaid = (yearBookings || []).filter(b => b.cleaner_paid).reduce((sum, b) => sum + (b.cleaner_pay || 0), 0)
  const yearLaborOwed = yearLabor - yearLaborPaid

  const pendingClientPayments = (pendingBookings || [])
    .filter(b => b.payment_status !== 'paid')
    .reduce((sum, b) => sum + (b.price || 0), 0)

  const pendingCleanerPayments = (pendingBookings || [])
    .filter(b => !b.cleaner_paid)
    .reduce((sum, b) => sum + (b.cleaner_pay || 0), 0)

  // Get referral commissions
  const { data: monthCommissions } = await supabaseAdmin
    .from('referral_commissions')
    .select('commission_amount')
    .gte('created_at', monthStart.toISOString())
    .lte('created_at', monthEnd.toISOString())

  const { data: yearCommissions } = await supabaseAdmin
    .from('referral_commissions')
    .select('commission_amount')
    .gte('created_at', yearStart.toISOString())
    .lte('created_at', yearEnd.toISOString())

  const monthReferralCommissions = (monthCommissions || []).reduce((sum, c) => sum + (c.commission_amount || 0), 0)
  const yearReferralCommissions = (yearCommissions || []).reduce((sum, c) => sum + (c.commission_amount || 0), 0)

  // Get per-cleaner breakdown
  const { data: cleanerPayroll } = await supabaseAdmin
    .from('bookings')
    .select('cleaner_id, cleaner_pay, cleaners(name)')
    .eq('status', 'completed')
    .or('cleaner_paid.is.null,cleaner_paid.eq.false')
    .not('cleaner_pay', 'is', null)

  const cleanerTotals: Record<string, { name: string; total: number; count: number }> = {}
  for (const b of cleanerPayroll || []) {
    if (!b.cleaner_id) continue
    const cleaner = b.cleaners as unknown as { name: string } | null
    if (!cleanerTotals[b.cleaner_id]) {
      cleanerTotals[b.cleaner_id] = { name: cleaner?.name || 'Unknown', total: 0, count: 0 }
    }
    cleanerTotals[b.cleaner_id].total += b.cleaner_pay || 0
    cleanerTotals[b.cleaner_id].count++
  }

  return NextResponse.json({
    weekRevenue,
    monthRevenue,
    yearRevenue,
    weekLabor,
    monthLabor,
    yearLabor,
    weekLaborPaid,
    monthLaborPaid,
    yearLaborPaid,
    weekLaborOwed,
    monthLaborOwed,
    yearLaborOwed,
    weekJobs: weekBookings?.length || 0,
    monthJobs: monthBookings?.length || 0,
    yearJobs: yearBookings?.length || 0,
    pendingClientPayments,
    pendingCleanerPayments,
    monthReferralCommissions,
    yearReferralCommissions,
    cleanerTotals: Object.entries(cleanerTotals).map(([id, data]) => ({
      cleaner_id: id,
      name: data.name,
      total: data.total,
      count: data.count
    })),
    recentPayments: (recentPayments || []).map(b => {
      const client = b.clients as unknown as { name: string } | null
      const cleaner = b.cleaners as unknown as { name: string } | null
      return {
        id: b.id,
        cleaner_paid_at: b.cleaner_paid_at,
        cleaner_pay: b.cleaner_pay || 0,
        actual_hours: b.actual_hours || 0,
        start_time: b.start_time,
        client_name: client?.name || 'Unknown',
        cleaner_name: cleaner?.name || 'Unknown',
      }
    })
  })
}
