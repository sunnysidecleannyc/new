'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/DashboardHeader'
import { ALL_DOMAINS } from '@/lib/domains'

interface LeadClick {
  id: string
  domain: string
  page: string
  action: string
  placement: string
  referrer: string
  device: string
  session_id: string
  scroll_depth: number
  time_on_page: number
  final_scroll: number
  final_time: number
  utm_source: string
  utm_campaign: string
  created_at: string
  visitor_ip: string | null
  returning: boolean
}

interface DomainStat {
  visits: number
  referredVisits: number
  directVisits: number
  uniqueVisitors: number
  calls: number
  texts: number
  books: number
  directions: number
  avgTime: number
  avgScroll: number
  mobilePercent: number
  engagedPercent: number
  convRate: number
  attributedBookings: number
  attributedRevenue: number
  avgConfidence: number
  returningVisitors: number
}

interface LeadsData {
  totals: {
    visits: number
    referredVisits: number
    directVisits: number
    uniqueVisitors: number
    calls: number
    texts: number
    books: number
    directions: number
    avgTimeOnPage: number
    avgScrollDepth: number
    mobilePercent: number
    attributionRate: number
    ctaConvRate: number
    todayVisits: number
    todayCTAs: number
    todaySales: number
    blockedDirectVisits: number
    weekVisits: number
    monthVisits: number
    annualVisits: number
    annualReferredVisits: number
    annualCalls: number
    annualTexts: number
    attributedBookings: number
    attributedRevenue: number
    annualAttributedBookings: number
    annualAttributedRevenue: number
    webSales: number
    returningVisitors: number
    allowedIPCount: number
  }
  domainStats: Record<string, DomainStat>
  ctaBreakdown: { calls: number; texts: number; books: number; directions: number }
  liveFeed: LeadClick[]
  allDomains: string[]
  referrerStats: Record<string, number>
}

type StatusFilter = 'all' | 'converting' | 'traffic' | 'none' | 'revenue'

export default function LeadsPage() {
  useEffect(() => { document.title = 'Leads | The NYC Maid' }, []);
  const [data, setData] = useState<LeadsData | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')
  const [drillDown, setDrillDown] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'visits' | 'calls' | 'texts' | 'convRate' | 'status' | 'avgTime' | 'avgScroll' | 'mobilePercent' | 'revenue'>('status')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('traffic')
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [attributing, setAttributing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalData, setModalData] = useState<{domain: string; count: number; detail?: string}[]>([])
  const [showAttrModal, setShowAttrModal] = useState(false)
  const [attrDomain, setAttrDomain] = useState('')
  const [attrBookings, setAttrBookings] = useState<{id: string; clientName: string; address: string; phone: string; date: string; price: number; status: string; attributed: string | null}[]>([])
  const [attrLoading, setAttrLoading] = useState(false)

  useEffect(() => {
    fetchData()
    fetchNotes()
  }, [dateRange])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ days: dateRange })
      const res = await fetch(`/api/leads?${params}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err)
    }
    setLoading(false)
  }

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/domain-notes')
      if (res.ok) {
        const json = await res.json()
        setNotes(json.notes || {})
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err)
    }
  }

  const runAttribution = async () => {
    setAttributing(true)
    try {
      const res = await fetch('/api/attribution?reset=true', { method: 'POST' })
      const json = await res.json()
      alert(`Attribution complete: ${json.attributed} of ${json.total} bookings attributed`)
      fetchData()
    } catch (err) {
      console.error('Attribution failed:', err)
      alert('Attribution failed')
    }
    setAttributing(false)
  }

  const saveNote = async (domain: string) => {
    try {
      await fetch('/api/domain-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, notes: noteText })
      })
      setNotes(prev => ({ ...prev, [domain]: noteText }))
      setEditingNote(null)
      setNoteText('')
    } catch (err) {
      console.error('Failed to save note:', err)
    }
  }

  const openManualAttribution = async (domain?: string) => {
    setAttrDomain(domain || '')
    setAttrLoading(true)
    setShowAttrModal(true)
    try {
      const res = await fetch('/api/attribution/manual')
      if (res.ok) {
        const json = await res.json()
        setAttrBookings(json.bookings || [])
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
    }
    setAttrLoading(false)
  }

  const submitManualAttribution = async (bookingId: string) => {
    if (!attrDomain) { alert('Select a domain first'); return }
    try {
      const res = await fetch('/api/attribution/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, domain: attrDomain })
      })
      if (res.ok) {
        alert('Sale attributed to ' + attrDomain)
        setShowAttrModal(false)
        fetchData()
      } else {
        alert('Attribution failed')
      }
    } catch (err) {
      alert('Attribution failed')
    }
  }

  const formatTime = (seconds: number) => {
    if (!seconds || seconds === 0) return '-'
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const formatMoney = (cents: number) => {
    if (!cents) return '-'
    return '$' + (cents / 100).toFixed(0)
  }

  const timeAgo = (dateStr: string) => {
    const then = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z')
    const estTime = then.toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    const now = new Date()
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000)
    if (diff < 0) return estTime
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return estTime.split(', ').pop() || estTime  // just show time today
    return estTime
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'visit': return '👁️'
      case 'call': return '📞'
      case 'text': return '💬'
      case 'book': return '📅'
      case 'directions': return '🗺️'
      default: return '•'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'visit': return 'text-gray-600'
      case 'call': return 'text-green-600'
      case 'text': return 'text-[#1E2A4A]'
      case 'book': return 'text-purple-600'
      case 'directions': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getActionBg = (action: string) => {
    switch (action) {
      case 'visit': return 'bg-gray-50'
      case 'call': return 'bg-green-50'
      case 'text': return 'bg-[#A8F0DC]/20'
      case 'book': return 'bg-purple-50'
      case 'directions': return 'bg-orange-50'
      default: return 'bg-gray-50'
    }
  }

  const getSourceIcon = (source: string) => {
    const s = source.toLowerCase()
    if (s.includes('google')) return '🔍'
    if (s.includes('bing')) return '🔎'
    if (s.includes('duckduckgo') || s.includes('ddg')) return '🦆'
    if (s.includes('yahoo')) return '📧'
    if (s.includes('chatgpt') || s.includes('openai')) return '🤖'
    if (s.includes('claude') || s.includes('anthropic')) return '🧠'
    if (s === 'direct') return '🔗'
    return '🌐'
  }

  const getDomainStatus = (domain: string): 'converting' | 'traffic' | 'none' | 'revenue' => {
    const stats = data?.domainStats?.[domain]
    if (!stats) return 'none'
    if (stats.attributedBookings > 0) return 'revenue'
    if (stats.calls > 0 || stats.texts > 0 || stats.books > 0) return 'converting'
    if (stats.visits > 0) return 'traffic'
    return 'none'
  }

  const getRecommendation = (domain: string): string => {
    const stats = data?.domainStats?.[domain]
    if (!stats) return 'No traffic yet. Check Google indexing. Submit to Search Console.'
    
    if (stats.attributedBookings > 0) {
      return `💰 Revenue generating! ${stats.attributedBookings} booking(s) at ${stats.avgConfidence}% confidence.`
    }
    
    if (stats.calls > 0 || stats.texts > 0) {
      return '✓ Converting! Study this site and replicate what works.'
    }
    
    if (stats.visits > 0 && stats.avgScroll < 25) {
      return 'Visitors bouncing. Check page speed, mobile layout, above-fold content.'
    }
    
    if (stats.visits > 0 && stats.avgScroll >= 25 && stats.avgScroll < 50) {
      return 'Some engagement but dropping off. Improve mid-page content and CTAs.'
    }
    
    if (stats.visits > 0 && stats.avgScroll >= 50 && stats.avgTime < 30) {
      return 'Scrolling but not reading. Content may be too thin. Add value.'
    }
    
    if (stats.visits > 0 && stats.avgScroll >= 50 && stats.avgTime >= 30) {
      return 'Good engagement but no CTAs. Make call/text buttons more prominent.'
    }
    
    if (stats.visits > 0) {
      return 'Getting traffic. Monitor for CTA clicks.'
    }
    
    return 'No data yet.'
  }

  const getDomainList = () => {
    return ALL_DOMAINS.map(domain => {
      const stats = data?.domainStats?.[domain]
      const status = getDomainStatus(domain)
      return {
        domain,
        status,
        visits: stats?.visits || 0,
        uniqueVisitors: stats?.uniqueVisitors || 0,
        calls: stats?.calls || 0,
        texts: stats?.texts || 0,
        books: stats?.books || 0,
        avgTime: stats?.avgTime || 0,
        avgScroll: stats?.avgScroll || 0,
        convRate: stats?.convRate || 0,
        attributedBookings: stats?.attributedBookings || 0,
        revenue: stats?.attributedRevenue || 0,
        avgConfidence: stats?.avgConfidence || 0,
        recommendation: getRecommendation(domain),
        note: notes[domain] || ''
      }
    })
  }

  const getFilteredDomains = () => {
    let list = getDomainList()
    
    if (statusFilter === 'traffic') {
      list = list.filter(d => d.status !== 'none')
    } else if (statusFilter === 'none') {
      list = list.filter(d => d.status === 'none')
    }
    
    list.sort((a, b) => {
      if (sortBy === 'status') {
        const order = { revenue: 4, converting: 3, traffic: 2, none: 1 }
        const diff = order[b.status] - order[a.status]
        return sortDir === 'desc' ? diff : -diff
      }
      if (sortBy === 'revenue') {
        return sortDir === 'desc' ? b.revenue - a.revenue : a.revenue - b.revenue
      }
      const aVal = a[sortBy as keyof typeof a]
      const bVal = b[sortBy as keyof typeof b]
      return sortDir === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number)
    })
    
    return list
  }

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>
  }

  const StatusBadge = ({ status }: { status: 'converting' | 'traffic' | 'none' | 'revenue' }) => {
    if (status === 'revenue') return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">💰 Revenue</span>
    if (status === 'converting') return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">🟢 Converting</span>
    if (status === 'traffic') return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">🟡 Traffic</span>
    return <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-medium">🔴 No Traffic</span>
  }

  const statusCounts = {
    revenue: getDomainList().filter(d => d.status === 'revenue').length,
    converting: getDomainList().filter(d => d.status === 'converting').length,
    traffic: getDomainList().filter(d => d.status === 'traffic').length,
    none: getDomainList().filter(d => d.status === 'none').length,
  }

  // Modal helpers
  // NOTE: Today/Week/Month modals filter from liveFeed which is capped at 500 events.
  // KPI totals are server-computed and accurate, but modal domain breakdowns may be
  // incomplete during high-traffic periods.
  const groupFeedByDomain = (events: LeadClick[]) => {
    const map: Record<string, number> = {}
    for (const e of events) map[e.domain] = (map[e.domain] || 0) + 1
    return Object.entries(map).map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count)
  }

  const openModal = (title: string, items: {domain: string; count: number; detail?: string}[]) => {
    setModalTitle(title)
    setModalData(items)
    setShowModal(true)
  }

  const getToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d }
  const getWeekStart = () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d }
  const getMonthStart = () => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d }

  const openTodayModal = () => {
    if (!data) return
    const today = getToday()
    const visits = (data.liveFeed || []).filter(e => e.action === 'visit' && new Date(e.created_at.endsWith('Z') ? e.created_at : e.created_at + 'Z') >= today)
    const ctas = (data.liveFeed || []).filter(e => e.action !== 'visit' && new Date(e.created_at.endsWith('Z') ? e.created_at : e.created_at + 'Z') >= today)
    const items = groupFeedByDomain(visits)
    const ctaMap: Record<string, string[]> = {}
    for (const c of ctas) { if (!ctaMap[c.domain]) ctaMap[c.domain] = []; ctaMap[c.domain].push(c.action) }
    openModal(`Today's Visits (${items.reduce((s, i) => s + i.count, 0)})`, items.map(i => ({
      ...i, detail: ctaMap[i.domain] ? ctaMap[i.domain].join(', ') : undefined
    })))
  }

  const openWeekModal = () => {
    if (!data) return
    const ws = getWeekStart()
    const visits = (data.liveFeed || []).filter(e => e.action === 'visit' && new Date(e.created_at.endsWith('Z') ? e.created_at : e.created_at + 'Z') >= ws)
    openModal(`This Week (${visits.length} visits)`, groupFeedByDomain(visits))
  }

  const openMonthModal = () => {
    if (!data) return
    const ms = getMonthStart()
    const visits = (data.liveFeed || []).filter(e => e.action === 'visit' && new Date(e.created_at.endsWith('Z') ? e.created_at : e.created_at + 'Z') >= ms)
    openModal(`This Month (${visits.length} visits)`, groupFeedByDomain(visits))
  }

  const openAnnualModal = () => {
    if (!data) return
    const items = Object.entries(data.domainStats || {})
      .filter(([, s]) => s.visits > 0)
      .map(([domain, s]) => ({ domain, count: s.visits }))
      .sort((a, b) => b.count - a.count)
    openModal(`Annual (${items.reduce((s, i) => s + i.count, 0)} visits)`, items)
  }

  const openLeadsModal = () => {
    if (!data) return
    const items = Object.entries(data.domainStats || {})
      .filter(([, s]) => s.calls + s.texts > 0)
      .map(([domain, s]) => ({ domain, count: s.calls + s.texts, detail: `${s.calls} calls · ${s.texts} texts` }))
      .sort((a, b) => b.count - a.count)
    openModal(`Total Leads (${items.reduce((s, i) => s + i.count, 0)})`, items)
  }

  const openBookingsModal = () => {
    if (!data) return
    const items = Object.entries(data.domainStats || {})
      .filter(([, s]) => s.attributedBookings > 0)
      .map(([domain, s]) => ({ domain, count: s.attributedBookings, detail: `$${(s.attributedRevenue / 100).toFixed(0)} revenue` }))
      .sort((a, b) => b.count - a.count)
    openModal(`Bookings by Domain (${data.totals?.annualAttributedBookings || 0} YTD)`, items)
  }

  const openConvModal = () => {
    if (!data) return
    const items = Object.entries(data.domainStats || {})
      .filter(([, s]) => s.visits > 0)
      .map(([domain, s]) => ({ domain, count: s.convRate, detail: `${s.calls + s.texts + s.books + s.directions} leads / ${s.referredVisits} search visits` }))
      .sort((a, b) => b.count - a.count)
    openModal('Conversion Rate by Domain', items.map(i => ({ ...i, count: i.count })))
  }

  // Get sorted referrer stats
  const getSortedReferrers = () => {
    if (!data?.referrerStats) return []
    const total = Object.values(data.referrerStats).reduce((sum, v) => sum + v, 0)
    return Object.entries(data.referrerStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([source, visits]) => ({
        source,
        visits,
        percent: total > 0 ? Math.round((visits / total) * 100) : 0
      }))
  }

  // Drill-down view
  if (drillDown && data) {
    const stats = data?.domainStats?.[drillDown]
    const domainFeed = (data.liveFeed || []).filter(e => e.domain === drillDown)
    const domainData = getDomainList().find(d => d.domain === drillDown)

    // Get referrers for this specific domain from feed
    const domainReferrers: Record<string, number> = {}
    domainFeed.filter(e => e.action === 'visit').forEach(e => {
      const raw = e.referrer
      if (!raw || raw.toLowerCase() === 'direct') return
      let ref = raw
      try {
        ref = new URL(ref).hostname.replace('www.', '')
      } catch {
        // keep as is
      }
      domainReferrers[ref] = (domainReferrers[ref] || 0) + 1
    })
    const domainRefSorted = Object.entries(domainReferrers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return (
      <div className="min-h-screen bg-white">
        <DashboardHeader currentPage="leads" />
        <main className="p-3 md:p-6">
          <div className="mb-6">
            <button
              onClick={() => setDrillDown(null)}
              className="text-[#1E2A4A] hover:underline flex items-center gap-2"
            >
              ← Back to all domains
            </button>
            <div className="flex items-center gap-3 mt-2">
              <h2 className="text-2xl font-semibold text-[#1E2A4A]">{drillDown}</h2>
              <StatusBadge status={domainData?.status || 'none'} />
              <a href={`https://${drillDown}`} target="_blank" rel="noopener noreferrer" className="text-[#1E2A4A]/70 hover:underline text-sm">
                Visit site ↗
              </a>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-9 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Visits</p>
              <p className="text-2xl font-bold text-[#1E2A4A]">{stats?.visits || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Unique</p>
              <p className="text-2xl font-bold text-[#1E2A4A]">{stats?.uniqueVisitors || 0}</p>
            </div>
            <div className="bg-cyan-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Returning</p>
              <p className="text-2xl font-bold text-cyan-600">{stats?.returningVisitors || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">📞 Calls</p>
              <p className="text-2xl font-bold text-green-600">{stats?.calls || 0}</p>
            </div>
            <div className="bg-[#A8F0DC]/20 rounded-lg p-4">
              <p className="text-sm text-gray-500">💬 Texts</p>
              <p className="text-2xl font-bold text-[#1E2A4A]">{stats?.texts || 0}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Conv %</p>
              <p className="text-2xl font-bold text-purple-600">{stats?.convRate || 0}%</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">💰 Sales</p>
              <p className="text-2xl font-bold text-emerald-600">{stats?.attributedBookings || 0}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-2xl font-bold text-emerald-600">{formatMoney(stats?.attributedRevenue || 0)}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Confidence</p>
              <p className="text-2xl font-bold text-amber-600">{stats?.avgConfidence || 0}%</p>
            </div>
          </div>

          {/* Quality + Traffic Sources + Recommendation */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-[#1E2A4A] mb-3">Engagement Quality</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Avg Time on Page</p>
                  <p className="text-xl font-bold">{formatTime(stats?.avgTime || 0)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Avg Scroll Depth</p>
                  <p className="text-xl font-bold">{stats?.avgScroll || 0}%</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-[#1E2A4A] mb-3">Traffic Sources</h3>
              {domainRefSorted.length === 0 ? (
                <p className="text-sm text-gray-500">No data yet</p>
              ) : (
                <div className="space-y-2">
                  {domainRefSorted.map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{getSourceIcon(source)}</span>
                        <span className="text-gray-700">{source}</span>
                      </span>
                      <span className="text-gray-500">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-[#A8F0DC]/20 rounded-lg p-4">
              <h3 className="font-semibold text-[#1E2A4A] mb-2">💡 Recommendation</h3>
              <p className="text-sm text-gray-700">{domainData?.recommendation}</p>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white border rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-[#1E2A4A] mb-2">📝 Notes</h3>
            {editingNote === drillDown ? (
              <div className="space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  rows={3}
                  placeholder="Add notes about this domain..."
                />
                <div className="flex gap-2">
                  <button onClick={() => saveNote(drillDown)} className="px-3 py-1 bg-[#1E2A4A] text-white rounded text-sm">Save</button>
                  <button onClick={() => { setEditingNote(null); setNoteText('') }} className="px-3 py-1 bg-gray-200 rounded text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => { setEditingNote(drillDown); setNoteText(notes[drillDown] || '') }}
                className="cursor-pointer text-sm text-gray-600 hover:bg-gray-50 p-2 rounded min-h-[60px]"
              >
                {notes[drillDown] || 'Click to add notes...'}
              </div>
            )}
          </div>

          {/* Recent events */}
          <div className="bg-white border rounded-lg">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-[#1E2A4A]">Recent Activity</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 text-left text-sm text-[#1E2A4A]">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Device</th>
                    <th className="px-4 py-3">Scroll</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Placement</th>
                    <th className="px-4 py-3">Referrer</th>
                    <th className="px-4 py-3">UTM</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {domainFeed.length === 0 ? (
                    <tr><td colSpan={8} className="p-4 text-gray-500 text-center">No events yet</td></tr>
                  ) : (
                    domainFeed.map((event, i) => (
                      <tr key={i} className={`${getActionBg(event.action)}`}>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {timeAgo(event.created_at)}
                          {event.returning && <span className="ml-1 px-1.5 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs font-medium" title={event.visitor_ip || ''}>Return</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1 text-sm font-medium ${getActionColor(event.action)}`}>
                            {getActionIcon(event.action)} {event.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{event.device}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{event.final_scroll || event.scroll_depth || 0}%</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatTime(event.final_time || event.time_on_page)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{event.placement || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{event.referrer || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{event.utm_source || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Main view
  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader currentPage="leads" />

      <main className="p-3 md:p-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-2xl font-semibold text-[#1E2A4A]">Lead Tracking</h2>
            <p className="text-gray-500">{ALL_DOMAINS.length} domains tracked</p>
          </div>
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-[#1E2A4A] bg-white"
            >
              <option value="1">Today</option>
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="0">All Time</option>
            </select>
            <button
              onClick={() => openManualAttribution()}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
            >
              💰 Attribute Sale
            </button>
            <button
              onClick={runAttribution}
              disabled={attributing}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {attributing ? 'Running...' : '🔄 Run Attribution'}
            </button>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-[#1E2A4A] text-white rounded-lg hover:bg-[#1E2A4A]/90"
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-500 mb-6">
          Client portal: <a href="https://www.thenycmaid.com/book" target="_blank" className="text-[#1E2A4A] hover:underline">thenycmaid.com/book</a> ·
          New booking: <a href="https://www.thenycmaid.com/book/new" target="_blank" className="text-[#1E2A4A] hover:underline ml-1">thenycmaid.com/book/new</a> ·
          Collect info: <a href="https://www.thenycmaid.com/book/collect" target="_blank" className="text-[#1E2A4A] hover:underline ml-1">thenycmaid.com/book/collect</a>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : data ? (
          <>
            {/* ========== ANALYTICS SECTION ========== */}
            
            {/* KPI Cards — Row 1: Traffic */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <button onClick={openTodayModal} className="bg-[#A8F0DC]/20 rounded-lg p-4 text-left hover:shadow-md transition border border-[#A8F0DC]/30">
                <p className="text-sm text-[#1E2A4A]">Today</p>
                <p className="text-2xl font-bold text-[#1E2A4A]/70">{data.totals?.todayVisits}</p>
                <p className="text-xs text-[#1E2A4A]/60">{data.totals?.todayCTAs} CTAs</p>
              </button>
              <button onClick={openWeekModal} className="bg-indigo-50 rounded-lg p-4 text-left hover:shadow-md transition border border-indigo-100">
                <p className="text-sm text-indigo-600">This Week</p>
                <p className="text-2xl font-bold text-indigo-700">{data.totals?.weekVisits}</p>
                <p className="text-xs text-indigo-400">visits</p>
              </button>
              <button onClick={openMonthModal} className="bg-violet-50 rounded-lg p-4 text-left hover:shadow-md transition border border-violet-100">
                <p className="text-sm text-violet-600">This Month</p>
                <p className="text-2xl font-bold text-violet-700">{data.totals?.monthVisits}</p>
                <p className="text-xs text-violet-400">visits</p>
              </button>
              <button onClick={openAnnualModal} className="bg-slate-50 rounded-lg p-4 text-left hover:shadow-md transition border border-slate-200">
                <p className="text-sm text-slate-600">Annual</p>
                <p className="text-2xl font-bold text-slate-700">{data.totals?.annualVisits}</p>
                <p className="text-xs text-slate-400">visits</p>
              </button>
            </div>

            {/* KPI Cards — Row 2: Conversions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <button onClick={openLeadsModal} className="bg-green-50 rounded-lg p-4 text-left hover:shadow-md transition">
                <p className="text-sm text-gray-500">Total Leads</p>
                <p className="text-2xl font-bold text-green-600">{(data.totals?.annualCalls || 0) + (data.totals?.annualTexts || 0)}</p>
                <p className="text-xs text-gray-400">{data.totals?.annualCalls} calls · {data.totals?.annualTexts} texts</p>
              </button>
              <button onClick={openBookingsModal} className="bg-emerald-50 rounded-lg p-4 text-left hover:shadow-md transition">
                <p className="text-sm text-gray-500">Web Bookings</p>
                <p className="text-2xl font-bold text-emerald-600">{data.totals?.annualAttributedBookings || 0}</p>
                <p className="text-xs text-gray-400">attributed to domains (YTD)</p>
              </button>
              <button onClick={openLeadsModal} className="bg-purple-50 rounded-lg p-4 text-left hover:shadow-md transition">
                <p className="text-sm text-gray-500">Close Rate</p>
                <p className="text-2xl font-bold text-purple-600">{(data.totals?.annualCalls || 0) + (data.totals?.annualTexts || 0) > 0 ? (((data.totals?.annualAttributedBookings || 0) / ((data.totals?.annualCalls || 0) + (data.totals?.annualTexts || 0))) * 100).toFixed(1) : 0}%</p>
                <p className="text-xs text-gray-400">web bookings / leads (YTD)</p>
              </button>
              <button onClick={openConvModal} className="bg-orange-50 rounded-lg p-4 text-left hover:shadow-md transition">
                <p className="text-sm text-gray-500">Search Conv</p>
                <p className="text-2xl font-bold text-orange-600">{(data.totals?.annualReferredVisits || 0) > 0 ? ((((data.totals?.annualCalls || 0) + (data.totals?.annualTexts || 0)) / (data.totals?.annualReferredVisits || 1)) * 100).toFixed(1) : 0}%</p>
                <p className="text-xs text-gray-400">leads / search visits</p>
              </button>
            </div>

            {/* Traffic Sources */}
            <div className="bg-white border rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-[#1E2A4A] mb-4">Traffic Sources</h3>
              {(() => {
                const refs = getSortedReferrers()
                if (refs.length === 0) return <p className="text-sm text-gray-500">No traffic data yet</p>
                const half = Math.ceil(refs.length / 2)
                const leftCol = refs.slice(0, half)
                const rightCol = refs.slice(half)
                const renderRow = ({ source, visits, percent }: { source: string; visits: number; percent: number }) => (
                  <div key={source} className="flex items-center gap-3">
                    <span className="w-6 text-center">{getSourceIcon(source)}</span>
                    <span className="flex-1 text-sm text-gray-700 truncate">{source}</span>
                    <div className="w-24 bg-gray-100 rounded-full h-3">
                      <div className="bg-indigo-500 h-3 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-10 text-right text-sm font-medium">{percent}%</span>
                    <span className="w-8 text-right text-sm text-gray-400">{visits}</span>
                  </div>
                )
                return (
                  <div className="grid md:grid-cols-2 gap-x-8">
                    <div className="space-y-2">{leftCol.map(renderRow)}</div>
                    <div className="space-y-2">{rightCol.map(renderRow)}</div>
                  </div>
                )
              })()}
            </div>

            {/* ========== DOMAIN HEALTH SECTION ========== */}
            
            <h3 className="text-xl font-semibold text-[#1E2A4A] mb-4">Domain Health</h3>

            {/* Status Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setStatusFilter(statusFilter === 'traffic' ? 'all' : 'traffic')}
                className={`p-4 rounded-lg text-left transition ${statusFilter === 'traffic' ? 'ring-2 ring-yellow-500' : ''} bg-yellow-50`}
              >
                <p className="text-sm text-yellow-600 font-medium">🟡 Traffic</p>
                <p className="text-3xl font-bold text-yellow-700">{statusCounts.traffic + statusCounts.converting + statusCounts.revenue}</p>
                <p className="text-xs text-yellow-600">Domains with visits</p>
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === 'none' ? 'all' : 'none')}
                className={`p-4 rounded-lg text-left transition ${statusFilter === 'none' ? 'ring-2 ring-gray-400' : ''} bg-gray-50`}
              >
                <p className="text-sm text-gray-500 font-medium">🔴 No Traffic</p>
                <p className="text-3xl font-bold text-gray-700">{statusCounts.none}</p>
                <p className="text-xs text-gray-500">Need SEO work</p>
              </button>
            </div>

            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="mb-4 text-sm text-[#1E2A4A] hover:underline"
              >
                ← Show all domains
              </button>
            )}

            {/* ========== LIVE FEED SECTION ========== */}

            <div className="bg-white border rounded-lg mb-8">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold text-[#1E2A4A]">Live Feed</h3>
                <span className="text-sm text-gray-400">Verified traffic only · last 500</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 text-left text-sm text-[#1E2A4A]">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Domain</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Device</th>
                      <th className="px-4 py-3">Scroll</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Placement</th>
                      <th className="px-4 py-3">Referrer</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {!data.liveFeed || data.liveFeed.length === 0 ? (
                      <tr><td colSpan={9} className="p-4 text-gray-500 text-center">No events in this period</td></tr>
                    ) : (
                      data.liveFeed.map((event, i) => (
                        <tr key={i} className={`${getActionBg(event.action)} hover:opacity-80`}>
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {timeAgo(event.created_at)}
                            {event.returning && <span className="ml-1 px-1.5 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs font-medium" title={event.visitor_ip || ''}>Return</span>}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setDrillDown(event.domain)}
                              className="text-[#1E2A4A] hover:underline text-sm font-medium"
                            >
                              {event.domain}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`flex items-center gap-1 text-sm font-medium ${getActionColor(event.action)}`}>
                              {getActionIcon(event.action)} {event.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{event.device}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{event.final_scroll || event.scroll_depth || 0}%</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatTime(event.final_time || event.time_on_page)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{event.placement || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-400 max-w-[200px] truncate" title={event.referrer || '-'}>{event.referrer || '-'}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openManualAttribution(event.domain)}
                              className="text-amber-500 hover:text-amber-700 text-sm font-medium"
                              title="Attribute sale to this domain"
                            >
                              💰
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========== DOMAIN HEALTH TABLE ========== */}
            <div className="bg-white border rounded-lg mb-8">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-[#1E2A4A]">
                  {statusFilter === 'all' ? 'All Domains' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Domains`}
                  <span className="text-gray-400 font-normal ml-2">({getFilteredDomains().length})</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-50 border-b border-gray-200 text-left text-sm text-[#1E2A4A]">
                    <tr>
                      <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                        Status <SortIcon col="status" />
                      </th>
                      <th className="px-4 py-3">Domain</th>
                      <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('visits')}>
                        Visits <SortIcon col="visits" />
                      </th>
                      <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('calls')}>
                        Calls <SortIcon col="calls" />
                      </th>
                      <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('texts')}>
                        Texts <SortIcon col="texts" />
                      </th>
                      <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('avgTime')}>
                        Avg Time <SortIcon col="avgTime" />
                      </th>
                      <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('avgScroll')}>
                        Scroll <SortIcon col="avgScroll" />
                      </th>
                      <th className="px-4 py-3">Engaged</th>
                      <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('convRate')}>
                        Conv% <SortIcon col="convRate" />
                      </th>
                      <th className="px-4 py-3">Mobile</th>
                      <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 bg-emerald-50" onClick={() => handleSort('revenue')}>
                        Sales <SortIcon col="revenue" />
                      </th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {getFilteredDomains().map((d) => (
                      <tr key={d.domain} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <StatusBadge status={d.status} />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setDrillDown(d.domain)}
                            className="text-[#1E2A4A] hover:underline font-medium"
                          >
                            {d.domain}
                          </button>
                        </td>
                        <td className="px-4 py-3">{d.visits}</td>
                        <td className="px-4 py-3 text-green-600">{d.calls}</td>
                        <td className="px-4 py-3 text-[#1E2A4A]">{d.texts}</td>
                        <td className="px-4 py-3 text-gray-600">{formatTime(data?.domainStats?.[d.domain]?.avgTime || 0)}</td>
                        <td className="px-4 py-3 text-gray-600">{data?.domainStats?.[d.domain]?.avgScroll || 0}%</td>
                        <td className="px-4 py-3">
                          <span className={(data?.domainStats?.[d.domain]?.engagedPercent || 0) >= 50 ? 'text-green-600 font-medium' : (data?.domainStats?.[d.domain]?.engagedPercent || 0) >= 25 ? 'text-yellow-600' : 'text-gray-600'}>
                            {data?.domainStats?.[d.domain]?.engagedPercent || 0}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={d.convRate >= 10 ? 'text-green-600 font-medium' : d.convRate >= 5 ? 'text-yellow-600' : 'text-gray-600'}>
                            {d.convRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{data?.domainStats?.[d.domain]?.mobilePercent || 0}%</td>
                        <td className="px-4 py-3 bg-emerald-50">
                          {d.attributedBookings > 0 ? (
                            <span className="font-medium text-emerald-700">
                              {d.attributedBookings} ({formatMoney(d.revenue)})
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingNote === d.domain ? (
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                className="w-32 px-2 py-1 border rounded text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && saveNote(d.domain)}
                                autoFocus
                              />
                              <button onClick={() => saveNote(d.domain)} className="text-green-600 text-sm">✓</button>
                              <button onClick={() => { setEditingNote(null); setNoteText('') }} className="text-gray-400 text-sm">✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingNote(d.domain); setNoteText(d.note) }}
                              className="text-gray-400 hover:text-gray-600 text-sm"
                            >
                              {d.note ? d.note.substring(0, 20) + (d.note.length > 20 ? '...' : '') : '+'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-red-500">Failed to load data</div>
        )}

      </main>

      {/* Manual attribution modal */}
      {showAttrModal && (
        <div className="fixed inset-0 bg-[#1E2A4A]/50 flex items-end md:items-center justify-center z-[1000]" onClick={() => setShowAttrModal(false)}>
          <div className="bg-white rounded-t-xl md:rounded-xl p-4 md:p-6 w-full md:max-w-lg max-h-[85vh] md:max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-[#1E2A4A] text-lg">Attribute Sale</h3>
              <button onClick={() => setShowAttrModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
              <input
                type="text"
                value={attrDomain}
                onChange={(e) => setAttrDomain(e.target.value)}
                placeholder="e.g. regoparkmaid.com"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <p className="text-sm text-gray-500 mb-2">Select a booking to attribute:</p>
            <div className="overflow-y-auto flex-1">
              {attrLoading ? (
                <p className="text-gray-500 text-sm py-4 text-center">Loading bookings...</p>
              ) : attrBookings.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No bookings found</p>
              ) : (
                <div className="space-y-1">
                  {attrBookings.map(b => (
                    <button
                      key={b.id}
                      onClick={() => submitManualAttribution(b.id)}
                      className={`w-full text-left px-3 py-3 rounded-lg border transition hover:shadow-md ${b.attributed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200 hover:border-amber-300'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-[#1E2A4A]">{b.clientName}</p>
                          <p className="text-xs text-gray-500">{b.address}</p>
                          {b.phone && <p className="text-xs text-gray-400">{b.phone}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{b.price ? '$' + (b.price / 100).toFixed(0) : '-'}</p>
                          <p className="text-xs text-gray-400">{new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                      {b.attributed && (
                        <p className="text-xs text-emerald-600 mt-1">Already attributed to {b.attributed}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Domain breakdown modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1E2A4A]/50 flex items-end md:items-center justify-center z-[1000]" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-t-xl md:rounded-xl p-4 md:p-6 w-full md:max-w-lg max-h-[85vh] md:max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-[#1E2A4A] text-lg">{modalTitle}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1">
              {modalData.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No data</p>
              ) : (
                <div className="space-y-1">
                  {modalData.map((item, i) => (
                    <button
                      key={item.domain}
                      onClick={() => { setShowModal(false); setDrillDown(item.domain) }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-gray-50 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-xs w-5">{i + 1}</span>
                        <span className="text-sm text-[#1E2A4A] font-medium">{item.domain}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.detail && <span className="text-xs text-gray-400">{item.detail}</span>}
                        <span className="text-sm font-bold text-[#1E2A4A]">{typeof item.count === 'number' && item.count % 1 !== 0 ? `${item.count}%` : item.count}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-3 mt-3 border-t text-sm text-gray-500 text-center">
              {modalData.length} domain{modalData.length !== 1 ? 's' : ''} · Click to drill down
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
