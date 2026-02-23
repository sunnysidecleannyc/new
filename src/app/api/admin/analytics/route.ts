import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'

// Supabase caps at 1000 rows per query. Paginate to get all rows (up to limit).
async function fetchAll(query: any, maxRows = 10000) {
  const PAGE = 1000
  let all: any[] = []
  let offset = 0
  while (all.length < maxRows) {
    const { data, error } = await query.range(offset, offset + PAGE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < PAGE) break
    offset += PAGE
  }
  return all.slice(0, maxRows)
}

function extractHostname(url: string): string {
  if (!url) return 'direct'
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    return parsed.hostname.replace('www.', '')
  } catch {
    return url
  }
}

export async function GET(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    // Date boundaries in EST
    const now = new Date()
    const estNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const estOffset = now.getTime() - estNow.getTime()
    const toUTC = (d: Date) => new Date(d.getTime() + estOffset)

    const todayEST = new Date(estNow)
    todayEST.setHours(0, 0, 0, 0)
    const todayStart = toUTC(todayEST)

    const sevenDaysAgoEST = new Date(estNow)
    sevenDaysAgoEST.setDate(sevenDaysAgoEST.getDate() - 7)
    sevenDaysAgoEST.setHours(0, 0, 0, 0)
    const sevenDaysStart = toUTC(sevenDaysAgoEST)

    const thirtyDaysAgoEST = new Date(estNow)
    thirtyDaysAgoEST.setDate(thirtyDaysAgoEST.getDate() - 30)
    thirtyDaysAgoEST.setHours(0, 0, 0, 0)
    const thirtyDaysStart = toUTC(thirtyDaysAgoEST)

    // Calculate period start date
    let periodStart: Date
    switch (period) {
      case 'today':
        periodStart = todayStart
        break
      case '7d':
        periodStart = sevenDaysStart
        break
      case '30d':
        periodStart = thirtyDaysStart
        break
      case 'all':
        periodStart = new Date('2020-01-01T00:00:00Z')
        break
      default:
        periodStart = thirtyDaysStart
    }

    const NYCMAID_DOMAINS = ['thenycmaid.com', 'www.thenycmaid.com']
    const CTA_ACTIONS = ['call', 'text', 'book']

    // Fetch all lead_clicks for the period (visits + CTAs + everything)
    const allRows = await fetchAll(
      supabaseAdmin
        .from('lead_clicks')
        .select('*')
        .in('domain', NYCMAID_DOMAINS)
        .gte('created_at', periodStart.toISOString())
        .order('created_at', { ascending: true }),
      10000
    )

    // Separate visit actions from CTA actions
    const visits = allRows.filter((r: any) => r.action === 'visit')
    const ctaClicks = allRows.filter((r: any) => CTA_ACTIONS.includes(r.action))

    // Form tracking actions
    const FORM_ACTIONS = ['form_start', 'form_step', 'form_success', 'form_abandon']
    const formEvents = allRows.filter((r: any) => FORM_ACTIONS.includes(r.action))

    // ── Overview ──

    const todayVisitors = visits.filter((v: any) => new Date(v.created_at) >= todayStart).length
    const weekVisitors = visits.filter((v: any) => new Date(v.created_at) >= sevenDaysStart).length
    const monthVisitors = visits.filter((v: any) => new Date(v.created_at) >= thirtyDaysStart).length

    const uniqueSessionIds = new Set(visits.map((v: any) => v.session_id).filter(Boolean))
    const uniqueVisitors = uniqueSessionIds.size

    // Average final_time for visits (use final_time, fall back to time_on_page)
    const visitsWithTime = visits.filter((v: any) => (v.final_time || v.time_on_page || 0) > 0)
    const avgTime = visitsWithTime.length > 0
      ? Math.round(visitsWithTime.reduce((sum: number, v: any) => sum + (v.final_time || v.time_on_page || 0), 0) / visitsWithTime.length)
      : 0

    // Average final_scroll for visits (use final_scroll, fall back to scroll_depth)
    const visitsWithScroll = visits.filter((v: any) => (v.final_scroll || v.scroll_depth || 0) > 0)
    const avgScroll = visitsWithScroll.length > 0
      ? Math.round(visitsWithScroll.reduce((sum: number, v: any) => sum + (v.final_scroll || v.scroll_depth || 0), 0) / visitsWithScroll.length)
      : 0

    // Bounce rate: sessions with only 1 visit action
    const sessionVisitCounts: Record<string, number> = {}
    for (const v of visits) {
      const sid = v.session_id
      if (!sid) continue
      sessionVisitCounts[sid] = (sessionVisitCounts[sid] || 0) + 1
    }
    const totalSessions = Object.keys(sessionVisitCounts).length
    const bounceSessions = Object.values(sessionVisitCounts).filter(c => c === 1).length
    const bounceRate = totalSessions > 0 ? Math.round((bounceSessions / totalSessions) * 100) : 0

    // CTA rate: % of sessions that had a call/text/book action
    const ctaSessionIds = new Set(ctaClicks.map((c: any) => c.session_id).filter(Boolean))
    const sessionsWithCTA = [...uniqueSessionIds].filter(sid => ctaSessionIds.has(sid)).length
    const ctaRate = uniqueVisitors > 0 ? Math.round((sessionsWithCTA / uniqueVisitors) * 100) : 0

    const overview = {
      todayVisitors,
      weekVisitors,
      monthVisitors,
      uniqueVisitors,
      avgTime,
      avgScroll,
      bounceRate,
      ctaRate,
    }

    // ── Traffic Sources ──

    const referrerCounts: Record<string, number> = {}
    for (const v of visits) {
      const raw = v.referrer
      let source: string
      if (!raw || raw === '' || raw === 'direct') {
        source = 'direct'
      } else {
        source = extractHostname(raw)
      }
      referrerCounts[source] = (referrerCounts[source] || 0) + 1
    }

    const totalVisits = visits.length
    const trafficSources = Object.entries(referrerCounts)
      .map(([source, count]) => ({
        source,
        visits: count,
        percent: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
      }))
      .sort((a, b) => b.visits - a.visits)

    // ── Top Pages ──

    const pageStats: Record<string, { visits: number; totalTime: number; totalScroll: number; timeCount: number; scrollCount: number }> = {}
    for (const v of visits) {
      const page = v.page || '/'
      if (!pageStats[page]) {
        pageStats[page] = { visits: 0, totalTime: 0, totalScroll: 0, timeCount: 0, scrollCount: 0 }
      }
      pageStats[page].visits++
      const ft = v.final_time || v.time_on_page || 0
      const fs = v.final_scroll || v.scroll_depth || 0
      if (ft > 0) {
        pageStats[page].totalTime += ft
        pageStats[page].timeCount++
      }
      if (fs > 0) {
        pageStats[page].totalScroll += fs
        pageStats[page].scrollCount++
      }
    }

    const topPages = Object.entries(pageStats)
      .map(([page, stats]) => ({
        page,
        visits: stats.visits,
        avgTime: stats.timeCount > 0 ? Math.round(stats.totalTime / stats.timeCount) : 0,
        avgScroll: stats.scrollCount > 0 ? Math.round(stats.totalScroll / stats.scrollCount) : 0,
      }))
      .sort((a, b) => b.visits - a.visits)

    // ── Devices ──

    const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 }
    for (const v of visits) {
      const dev = (v.device || '').toLowerCase()
      if (dev === 'mobile') deviceCounts.mobile++
      else if (dev === 'tablet') deviceCounts.tablet++
      else deviceCounts.desktop++
    }
    const deviceTotal = deviceCounts.mobile + deviceCounts.desktop + deviceCounts.tablet
    const devices = {
      mobile: deviceTotal > 0 ? Math.round((deviceCounts.mobile / deviceTotal) * 100) : 0,
      desktop: deviceTotal > 0 ? Math.round((deviceCounts.desktop / deviceTotal) * 100) : 0,
      tablet: deviceTotal > 0 ? Math.round((deviceCounts.tablet / deviceTotal) * 100) : 0,
    }

    // ── Journey ──

    // Group all rows by session_id, ordered by created_at (already sorted ascending)
    const sessionPages: Record<string, string[]> = {}
    for (const row of allRows) {
      if (row.action !== 'visit') continue
      const sid = row.session_id
      if (!sid) continue
      if (!sessionPages[sid]) sessionPages[sid] = []
      sessionPages[sid].push(row.page || '/')
    }

    const sessionCounts = Object.values(sessionPages)
    const avgPagesPerSession = sessionCounts.length > 0
      ? Math.round((sessionCounts.reduce((sum, pages) => sum + pages.length, 0) / sessionCounts.length) * 10) / 10
      : 0

    // Count consecutive page pairs
    const flowCounts: Record<string, number> = {}
    for (const pages of Object.values(sessionPages)) {
      for (let i = 0; i < pages.length - 1; i++) {
        const key = `${pages[i]}|||${pages[i + 1]}`
        flowCounts[key] = (flowCounts[key] || 0) + 1
      }
    }

    const topFlows = Object.entries(flowCounts)
      .map(([key, count]) => {
        const [from, to] = key.split('|||')
        return { from, to, count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const journey = {
      avgPagesPerSession,
      topFlows,
    }

    // ── Hourly Traffic ──

    const hourCounts: Record<number, number> = {}
    for (let h = 0; h < 24; h++) hourCounts[h] = 0

    const todayVisits = visits.filter((v: any) => new Date(v.created_at) >= todayStart)
    for (const v of todayVisits) {
      const visitDate = new Date(v.created_at)
      // Convert to EST hour
      const estDate = new Date(visitDate.toLocaleString('en-US', { timeZone: 'America/New_York' }))
      const hour = estDate.getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    }

    const hourlyTraffic = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      visits: hourCounts[h] || 0,
    }))

    // ── Recent Visitors ──

    const recentVisitors = visits
      .slice()
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50)
      .map((v: any) => ({
        time: v.created_at,
        page: v.page || '/',
        referrer: v.referrer || '',
        device: v.device || 'unknown',
        time_on_page: v.final_time || v.time_on_page || 0,
        scroll_depth: v.final_scroll || v.scroll_depth || 0,
      }))

    // ── Form Funnels ──

    const FORM_PAGES = [
      { page: '/book/new', label: 'Booking' },
      { page: '/book/collect', label: 'Collect' },
      { page: '/referral/signup', label: 'Referral' },
    ]

    const formFunnels = FORM_PAGES.map(({ page, label }) => {
      const pageEvents = formEvents.filter((e: any) => e.page === page)
      const starts = pageEvents.filter((e: any) => e.action === 'form_start').length
      const successes = pageEvents.filter((e: any) => e.action === 'form_success').length
      const abandons = pageEvents.filter((e: any) => e.action === 'form_abandon').length
      const rate = starts > 0 ? Math.round((successes / starts) * 100) : 0

      // Step breakdown for booking form
      let steps: { step: number; count: number }[] | undefined
      if (page === '/book/new') {
        const step2 = pageEvents.filter((e: any) => e.action === 'form_step' && e.placement === 'step_2').length
        const step3 = pageEvents.filter((e: any) => e.action === 'form_step' && e.placement === 'step_3').length
        steps = [
          { step: 1, count: starts },
          { step: 2, count: step2 },
          { step: 3, count: step3 },
          { step: 4, count: successes }, // "step 4" = completed
        ]
      }

      return { page, label, starts, successes, abandons, rate, steps }
    })

    return NextResponse.json({
      overview,
      trafficSources,
      topPages,
      devices,
      journey,
      hourlyTraffic,
      recentVisitors,
      formFunnels,
    })
  } catch (err) {
    console.error('Analytics GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
