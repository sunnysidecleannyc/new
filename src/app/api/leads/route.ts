import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'
import { OWNED_DOMAINS } from '@/lib/domains'

// Supabase caps at 1000 rows per query. Paginate to get all rows.
async function fetchAll(query: any) {
  const PAGE = 1000
  let all: any[] = []
  let offset = 0
  while (true) {
    const { data, error } = await query.range(offset, offset + PAGE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < PAGE) break
    offset += PAGE
  }
  return all
}

export async function GET(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // All date boundaries in EST (America/New_York)
    const now = new Date()
    const estNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const estOffset = now.getTime() - estNow.getTime()
    const toUTC = (d: Date) => new Date(d.getTime() + estOffset)

    // days=0 means all time
    const startDate = days === 0
      ? new Date('2020-01-01T00:00:00Z')
      : (() => {
          const s = new Date(estNow)
          s.setDate(s.getDate() - days)
          s.setHours(0, 0, 0, 0)
          return toUTC(s)
        })()

    const todayEST = new Date(estNow)
    todayEST.setHours(0, 0, 0, 0)
    const todayStart = toUTC(todayEST)

    // ── Filter helpers ──
    const SPAM_REFERRERS = [
      'siteground', 'consortium', 'sgcaptcha',
      'twicsy.com', 'merobase.com', 'notidc.com', 'wicked.cc', 'brilliant.org',
      'colorhunt.co', 'vatrouver.com', 'nerdydata.com', 'pptsearch365.com',
      'zhongsou.com', 'tgis.schoolbox.cloud', 'telnyx.io', 'satchelone.com',
      'sharepoint.com', 'teams.microsoft', 'teams.cloud.microsoft', 'askboth.com',
      'activesearchresults.com', 'schoolbox.cloud',
    ]
    const isNoise = (r: string) => {
      const low = (r || '').toLowerCase()
      return SPAM_REFERRERS.some(s => low.includes(s))
    }
    const isDirect = (r: string) => {
      const low = (r || '').toLowerCase()
      return !low || low === 'direct'
    }
    const isSelfReferral = (r: string) => {
      const low = (r || '').toLowerCase()
      if (low.includes('nycsidehustle')) return true
      try {
        const host = new URL(low.startsWith('http') ? low : `https://${low}`).hostname.replace('www.', '')
        if (OWNED_DOMAINS.has(host) || OWNED_DOMAINS.has(`www.${host}`)) return true
      } catch {}
      return false
    }
    const isLegitReferrer = (r: string) => !isDirect(r) && !isNoise(r) && !isSelfReferral(r)
    const ctaActions = ['call', 'text', 'book', 'directions']
    const normDomain = (d: string) => (d || '').replace(/^www\./, '')

    // ── Step 1: Build allowlists (session_id + IP) ──
    // Session IDs and IPs that have EVER visited from a legit external referrer.
    // session_id is in localStorage per domain — populated on ALL records (unlike visitor_ip).
    // This means if someone finds uesmaid.com via Google, then comes back directly,
    // the same session_id identifies them as a returning search visitor.
    const referredVisitsAllTime = await fetchAll(
      supabaseAdmin
        .from('lead_clicks')
        .select('visitor_ip, session_id, referrer')
        .eq('action', 'visit')
        .not('referrer', 'is', null)
        .neq('referrer', '')
        .neq('referrer', 'direct')
        .order('created_at', { ascending: false })
    )

    const allowedIPs = new Set<string>()
    const allowedSessions = new Set<string>()
    for (const v of referredVisitsAllTime) {
      if (isLegitReferrer(v.referrer)) {
        if (v.visitor_ip) allowedIPs.add(v.visitor_ip)
        if (v.session_id) allowedSessions.add(v.session_id)
      }
    }

    // EMD filter: only count traffic from legit external sources.
    // Nobody types "uwscarpetcleaner.com" — direct traffic on EMDs is bots/noise.
    // Exception: returning visitors whose session_id or IP was seen from search/AI before.
    const isVerified = (c: { referrer: string; visitor_ip: string | null; session_id: string | null }) => {
      if (isNoise(c.referrer)) return false
      if (isSelfReferral(c.referrer)) return false  // Block EMD-to-EMD referrals completely
      if (isLegitReferrer(c.referrer)) return true
      // Direct only: allow if session or IP was previously seen from search/AI
      if (c.session_id && allowedSessions.has(c.session_id)) return true
      if (c.visitor_ip && allowedIPs.has(c.visitor_ip)) return true
      return false
    }

    // ── Step 2: Fetch windowed visits + CTAs + scroll/engaged events ──
    const [rawVisitsAll, rawCTAsAll, scrollEventsAll] = await Promise.all([
      fetchAll(
        supabaseAdmin
          .from('lead_clicks')
          .select('*')
          .eq('action', 'visit')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
      ),
      fetchAll(
        supabaseAdmin
          .from('lead_clicks')
          .select('*')
          .in('action', ctaActions)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
      ),
      fetchAll(
        supabaseAdmin
          .from('lead_clicks')
          .select('action, session_id, domain, scroll_depth, time_on_page, created_at')
          .in('action', ['scroll_25', 'scroll_50', 'scroll_75', 'scroll_100', 'engaged_30s'])
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
      ),
    ])

    // ── Step 2b: Build per-session engagement from engaged_30s events only ──
    // Scroll events are unreliable (bots scroll 0-100% in <1s with time=0).
    // engaged_30s proves a real 30s+ session. Don't merge into time/scroll columns
    // — the PATCH (page leave) will populate those going forward.
    const engagedSessions = new Set<string>()
    for (const e of scrollEventsAll) {
      if (e.action === 'engaged_30s' && e.session_id) {
        engagedSessions.add(e.session_id)
      }
    }

    // Mark visits as engaged (for Engaged % stat) but don't fake time/scroll
    const rawVisits = rawVisitsAll.map((v: any) => {
      if (v.session_id && engagedSessions.has(v.session_id)) {
        v.engaged_30s = true
      }
      return v
    })

    // ── Step 3: Apply IP allowlist filter ──
    const rawCTAs = rawCTAsAll

    const allVisits = rawVisits.filter(isVerified)
    const blockedVisits = rawVisits.filter(c => !isNoise(c.referrer) && !isVerified(c))
    const referredVisits = allVisits.filter(c => isLegitReferrer(c.referrer))
    const directVisits = allVisits.filter(c => isDirect(c.referrer) || isSelfReferral(c.referrer))
    // CTAs: only filter noise. A call/text is a real lead regardless of referrer.
    const ctaClicks = rawCTAs.filter(c => !isNoise(c.referrer))

    const allClicks = [...allVisits, ...ctaClicks].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    const calls = ctaClicks.filter(c => c.action === 'call')
    const texts = ctaClicks.filter(c => c.action === 'text')
    const books = ctaClicks.filter(c => c.action === 'book')
    const directions = ctaClicks.filter(c => c.action === 'directions')

    const uniqueSessions = new Set(allClicks.map(c => c.session_id || c.lead_id || c.id))
    const mobileClicks = allVisits.filter(c => c.device === 'mobile')

    const visitsWithTime = allVisits.filter(v => (v.final_time || v.time_on_page || 0) > 0)
    const avgTimeOnPage = visitsWithTime.length > 0
      ? Math.round(visitsWithTime.reduce((sum, v) => sum + (v.final_time || v.time_on_page || 0), 0) / visitsWithTime.length)
      : 0
    const visitsWithScroll = allVisits.filter(v => (v.final_scroll || v.scroll_depth || 0) > 0)
    const avgScrollDepth = visitsWithScroll.length > 0
      ? Math.round(visitsWithScroll.reduce((sum, v) => sum + (v.final_scroll || v.scroll_depth || 0), 0) / visitsWithScroll.length)
      : 0

    const uniqueVisitSessions = new Set(allVisits.map(c => c.session_id || c.lead_id || c.id)).size

    // ── Today / Week / Month breakdowns ──
    const todayVisitsOnly = allVisits.filter(c => new Date(c.created_at) >= todayStart)
    const todayCTAs = ctaClicks.filter(c => new Date(c.created_at) >= todayStart)

    const weekEST = new Date(estNow)
    weekEST.setDate(weekEST.getDate() - weekEST.getDay())
    weekEST.setHours(0, 0, 0, 0)
    const weekStart = toUTC(weekEST)

    const monthEST = new Date(estNow)
    monthEST.setDate(1)
    monthEST.setHours(0, 0, 0, 0)
    const monthStart = toUTC(monthEST)

    const weekVisits = allVisits.filter(c => new Date(c.created_at) >= weekStart).length
    const monthVisits = allVisits.filter(c => new Date(c.created_at) >= monthStart).length

    // ── Annual stats (also IP-filtered) ──
    const yearEST = new Date(estNow.getFullYear(), 0, 1, 0, 0, 0, 0)
    const yearStart = toUTC(yearEST)
    const yearStartISO = yearStart.toISOString()

    const [annualVisitsAll, annualCTAsAll, allTimeWebBookingsRes] = await Promise.all([
      fetchAll(
        supabaseAdmin
          .from('lead_clicks')
          .select('referrer, visitor_ip, session_id')
          .eq('action', 'visit')
          .gte('created_at', yearStartISO)
          .order('created_at', { ascending: false })
      ),
      fetchAll(
        supabaseAdmin
          .from('lead_clicks')
          .select('action, referrer')
          .in('action', ['call', 'text'])
          .gte('created_at', yearStartISO)
          .order('created_at', { ascending: false })
      ),
      supabaseAdmin
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yearStartISO),
    ])

    const annualVisitsFiltered = annualVisitsAll.filter(isVerified)
    const annualVisits = annualVisitsFiltered.length
    const annualReferredVisits = annualVisitsFiltered.filter(c => isLegitReferrer(c.referrer)).length
    // CTAs: only filter noise, not direct (a call is a real lead)
    const annualCTAsFiltered = annualCTAsAll.filter(c => !isNoise(c.referrer))
    const annualCalls = annualCTAsFiltered.filter(c => c.action === 'call').length
    const annualTexts = annualCTAsFiltered.filter(c => c.action === 'text').length
    const webSales = allTimeWebBookingsRes.count || 0

    // ── Attributed bookings (windowed — for domain table + drilldowns) ──
    const { data: attributedBookings } = await supabaseAdmin
      .from('bookings')
      .select('attributed_domain, attribution_confidence, price, status, created_at')
      .not('attributed_domain', 'is', null)
      .gte('created_at', startDate.toISOString())

    // ── Attributed bookings (annual — for Row 2 KPI cards) ──
    const { data: annualAttributedBookingsRaw } = await supabaseAdmin
      .from('bookings')
      .select('attributed_domain, price, created_at')
      .not('attributed_domain', 'is', null)
      .gte('created_at', yearStartISO)

    const attributionByDomain: Record<string, { bookings: number; revenue: number; totalConfidence: number }> = {}
    let totalAttributedBookings = 0
    let totalAttributedRevenue = 0
    let todaySales = 0

    attributedBookings?.forEach(b => {
      const domain = normDomain(b.attributed_domain)
      if (!attributionByDomain[domain]) {
        attributionByDomain[domain] = { bookings: 0, revenue: 0, totalConfidence: 0 }
      }
      attributionByDomain[domain].bookings++
      attributionByDomain[domain].revenue += b.price || 0
      attributionByDomain[domain].totalConfidence += b.attribution_confidence || 0
      totalAttributedBookings++
      totalAttributedRevenue += b.price || 0
      if (new Date(b.created_at) >= todayStart) todaySales++
    })

    let annualAttributedBookings = 0
    let annualAttributedRevenue = 0
    annualAttributedBookingsRaw?.forEach(b => {
      annualAttributedBookings++
      annualAttributedRevenue += b.price || 0
    })

    const attributionRate = uniqueVisitSessions > 0 ? parseFloat(((totalAttributedBookings / uniqueVisitSessions) * 100).toFixed(1)) : 0
    const totalCTAs = calls.length + texts.length + books.length + directions.length
    const ctaConvRate = referredVisits.length > 0 ? parseFloat(((totalCTAs / referredVisits.length) * 100).toFixed(1)) : 0

    // ── Domain stats ──
    const domainStats: Record<string, any> = {}
    const domainClicks: Record<string, typeof allClicks> = {}

    for (const click of allClicks) {
      const nd = normDomain(click.domain)
      if (!domainClicks[nd]) domainClicks[nd] = []
      domainClicks[nd].push(click)
    }

    for (const [domain, dClicks] of Object.entries(domainClicks)) {
      const dAllVisits = dClicks.filter(c => c.action === 'visit')
      const dReferredVisits = dAllVisits.filter(c => isLegitReferrer(c.referrer))
      const dDirectVisits = dAllVisits.filter(c => isDirect(c.referrer) || isSelfReferral(c.referrer))
      const dCalls = dClicks.filter(c => c.action === 'call')
      const dTexts = dClicks.filter(c => c.action === 'text')
      const dBooks = dClicks.filter(c => c.action === 'book')
      const dDirections = dClicks.filter(c => c.action === 'directions')
      const dUnique = new Set(dClicks.map(c => c.session_id || c.lead_id || c.id))

      const dVisitsWithTime = dAllVisits.filter(v => (v.final_time || v.time_on_page || 0) > 0)
      const dAvgTime = dVisitsWithTime.length > 0
        ? Math.round(dVisitsWithTime.reduce((sum, v) => sum + (v.final_time || v.time_on_page || 0), 0) / dVisitsWithTime.length)
        : 0
      const dVisitsWithScroll = dAllVisits.filter(v => (v.final_scroll || v.scroll_depth || 0) > 0)
      const dAvgScroll = dVisitsWithScroll.length > 0
        ? Math.round(dVisitsWithScroll.reduce((sum, v) => sum + (v.final_scroll || v.scroll_depth || 0), 0) / dVisitsWithScroll.length)
        : 0
      const dMobile = dAllVisits.filter(c => c.device === 'mobile').length
      const dMobilePercent = dAllVisits.length > 0 ? Math.round((dMobile / dAllVisits.length) * 100) : 0
      const dEngaged = dAllVisits.filter(v => v.engaged_30s === true).length
      const dEngagedPercent = dAllVisits.length > 0 ? Math.round((dEngaged / dAllVisits.length) * 100) : 0
      const dTotalCTAs = dCalls.length + dTexts.length + dBooks.length + dDirections.length
      const dUniqueVisitSessions = new Set(dAllVisits.map(c => c.session_id || c.lead_id || c.id)).size
      // Conv rate uses referred visits only — direct returns (dev visits, returning users) inflate denominator
      const dConvRate = dReferredVisits.length > 0 ? parseFloat(((dTotalCTAs / dReferredVisits.length) * 100).toFixed(1)) : 0

      const attr = attributionByDomain[domain]
      domainStats[domain] = {
        visits: dAllVisits.length,
        referredVisits: dReferredVisits.length,
        directVisits: dDirectVisits.length,
        uniqueVisitors: dUnique.size,
        calls: dCalls.length,
        texts: dTexts.length,
        books: dBooks.length,
        directions: dDirections.length,
        avgTime: dAvgTime,
        avgScroll: dAvgScroll,
        mobilePercent: dMobilePercent,
        engagedPercent: dEngagedPercent,
        convRate: dConvRate,
        attributedBookings: attr?.bookings || 0,
        attributedRevenue: attr?.revenue || 0,
        avgConfidence: attr ? Math.round(attr.totalConfidence / attr.bookings) : 0,
      }
    }

    // ── Returning visitors ──
    const ipSessions: Record<string, Set<string>> = {}
    for (const click of allClicks) {
      const ip = click.visitor_ip
      if (!ip) continue
      if (!ipSessions[ip]) ipSessions[ip] = new Set()
      ipSessions[ip].add(click.session_id || click.id)
    }
    const returningIPs = new Set(Object.entries(ipSessions).filter(([, sessions]) => sessions.size > 1).map(([ip]) => ip))
    const totalReturning = returningIPs.size

    for (const [domain, stats] of Object.entries(domainStats)) {
      const dClicks = domainClicks[domain] || []
      const dIPSessions: Record<string, Set<string>> = {}
      for (const click of dClicks) {
        const ip = click.visitor_ip
        if (!ip) continue
        if (!dIPSessions[ip]) dIPSessions[ip] = new Set()
        dIPSessions[ip].add(click.session_id || click.id)
      }
      ;(stats as any).returningVisitors = Object.values(dIPSessions).filter(s => s.size > 1).length
    }

    // ── Referrer stats ──
    const referrerStats: Record<string, number> = {}
    for (const click of allVisits) {
      const raw = click.referrer
      let ref = isDirect(raw) ? 'direct' : raw
      if (ref !== 'direct') {
        try { ref = new URL(ref).hostname.replace('www.', '') } catch {}
      }
      referrerStats[ref] = (referrerStats[ref] || 0) + 1
    }

    return NextResponse.json({
      totals: {
        visits: allVisits.length,
        referredVisits: referredVisits.length,
        directVisits: directVisits.length,
        blockedDirectVisits: blockedVisits.length,
        uniqueVisitors: uniqueSessions.size,
        calls: calls.length,
        texts: texts.length,
        books: books.length,
        directions: directions.length,
        avgTimeOnPage,
        avgScrollDepth,
        mobilePercent: allVisits.length > 0 ? Math.round((mobileClicks.length / allVisits.length) * 100) : 0,
        attributionRate,
        ctaConvRate,
        todayVisits: todayVisitsOnly.length,
        todayCTAs: todayCTAs.length,
        todaySales,
        weekVisits,
        monthVisits,
        annualVisits,
        annualReferredVisits,
        annualCalls,
        annualTexts,
        attributedBookings: totalAttributedBookings,
        attributedRevenue: totalAttributedRevenue,
        annualAttributedBookings,
        annualAttributedRevenue,
        webSales,
        returningVisitors: totalReturning,
        allowedIPCount: allowedIPs.size,
      },
      domainStats,
      ctaBreakdown: { calls: calls.length, texts: texts.length, books: books.length, directions: directions.length },
      liveFeed: allClicks.slice(0, 500).map(c => ({
        ...c,
        domain: normDomain(c.domain),
        returning: c.visitor_ip ? returningIPs.has(c.visitor_ip) : false,
      })),
      referrerStats,
    })
  } catch (err) {
    console.error('Leads GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}
