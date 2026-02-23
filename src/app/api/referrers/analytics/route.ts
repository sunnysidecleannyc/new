import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'

export async function GET() {
  const authError = await protectAdminAPI()
  if (authError) return authError

  try {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get ALL lead clicks (for total site traffic)
    const { data: allSiteClicks } = await supabaseAdmin
      .from('lead_clicks')
      .select('ref_code, action, session_id, lead_id, device, page, created_at')
      .order('created_at', { ascending: false })

    const siteClicks = allSiteClicks || []

    // Separate referral clicks (have ref_code) from general traffic
    const refClicks = siteClicks.filter(c => c.ref_code)
    const refWeekClicks = refClicks.filter(c => new Date(c.created_at + 'Z') >= weekAgo)

    const refUniqueVisitors = new Set(refClicks.map(c => c.session_id || c.lead_id)).size
    const refBookClicks = refClicks.filter(c => c.action === 'book').length
    const refCallClicks = refClicks.filter(c => c.action === 'call').length

    // Get referred bookings
    const { data: referredBookings } = await supabaseAdmin
      .from('bookings')
      .select('id, status, price, referrer_id')
      .not('referrer_id', 'is', null)

    const allReferred = referredBookings || []
    const completedReferred = allReferred.filter(b => b.status === 'completed')
    const allReferredRevenue = allReferred.reduce((sum, b) => sum + (b.price || 0), 0)

    // Top referrers by clicks
    const refClickCounts: Record<string, { ref_code: string; clicks: number; bookClicks: number }> = {}
    for (const click of refClicks) {
      if (!refClickCounts[click.ref_code]) {
        refClickCounts[click.ref_code] = { ref_code: click.ref_code, clicks: 0, bookClicks: 0 }
      }
      refClickCounts[click.ref_code].clicks++
      if (click.action === 'book') refClickCounts[click.ref_code].bookClicks++
    }

    // Get referrer names and booking counts
    const { data: referrers } = await supabaseAdmin.from('referrers').select('id, name, ref_code, total_earned')
    const refMap: Record<string, { id: string; name: string; total_earned: number }> = {}
    for (const r of referrers || []) {
      refMap[r.ref_code] = { id: r.id, name: r.name, total_earned: r.total_earned || 0 }
    }

    const topReferrers = Object.values(refClickCounts)
      .map(r => ({
        name: refMap[r.ref_code]?.name || r.ref_code,
        ref_code: r.ref_code,
        clicks: r.clicks,
        bookClicks: r.bookClicks,
        bookings: allReferred.filter(b => b.referrer_id === refMap[r.ref_code]?.id).length,
        earned: refMap[r.ref_code]?.total_earned || 0
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10)

    // Recent activity — show referral clicks first, then general if not enough
    const refActivity = refClicks.slice(0, 20)
    const recentActivity = (refActivity.length > 0 ? refActivity : siteClicks.slice(0, 20)).map(c => ({
      ref_code: c.ref_code || 'direct',
      action: c.action,
      device: c.device || 'unknown',
      page: c.page || '/',
      time: c.created_at
    }))

    // Daily clicks (last 14 days) — referral clicks only
    const dailyClicks: { date: string; clicks: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = d.toISOString().split('T')[0]
      const count = refClicks.filter(c => c.created_at.startsWith(dateStr)).length
      dailyClicks.push({ date: dateStr, clicks: count })
    }

    return NextResponse.json({
      overview: {
        totalClicks: refClicks.length,
        weekClicks: refWeekClicks.length,
        monthClicks: refClicks.length,
        bookClicks: refBookClicks,
        callClicks: refCallClicks,
        uniqueVisitors: refUniqueVisitors,
        totalReferredBookings: allReferred.length,
        completedReferredBookings: completedReferred.length,
        referredRevenue: allReferredRevenue,
        conversionRate: refUniqueVisitors > 0 ? ((allReferred.length / refUniqueVisitors) * 100).toFixed(1) : '0',
        totalSiteClicks: siteClicks.length
      },
      topReferrers,
      recentActivity,
      dailyClicks
    })
  } catch (err) {
    console.error('Referrer analytics error:', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
