'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/DashboardHeader'

type TimePeriod = 'today' | '7d' | '30d' | 'all'

interface OverviewData {
  todayVisitors: number
  weekVisitors: number
  monthVisitors: number
  uniqueVisitors: number
  avgTime: number
  avgScroll: number
  bounceRate: number
  ctaRate: number
}

interface TrafficSource {
  source: string
  visits: number
  percent: number
}

interface TopPage {
  page: string
  visits: number
  avgTime: number
  avgScroll: number
}

interface DeviceBreakdown {
  mobile: number
  desktop: number
  tablet: number
}

interface PageFlow {
  from: string
  to: string
  count: number
}

interface JourneyData {
  avgPagesPerSession: number
  topFlows: PageFlow[]
}

interface HourlyTraffic {
  hour: number
  visits: number
}

interface RecentVisitor {
  time: string
  page: string
  referrer: string
  device: string
  time_on_page: number
  scroll_depth: number
}

interface FormFunnel {
  page: string
  label: string
  starts: number
  successes: number
  abandons: number
  rate: number
  steps?: { step: number; count: number }[]
}

interface AnalyticsData {
  overview: OverviewData
  trafficSources: TrafficSource[]
  topPages: TopPage[]
  devices: DeviceBreakdown
  journey: JourneyData
  hourlyTraffic: HourlyTraffic[]
  recentVisitors: RecentVisitor[]
  formFunnels: FormFunnel[]
}

export default function AnalyticsPage() {
  useEffect(() => { document.title = 'Analytics | The NYC Maid' }, [])

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<TimePeriod>('7d')

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`)
      if (!res.ok) {
        throw new Error(`Failed to fetch analytics (${res.status})`)
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics data')
    }
    setLoading(false)
  }

  const formatTime = (seconds: number) => {
    if (!seconds || seconds === 0) return '-'
    if (seconds < 60) return `${Math.round(seconds)}s`
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${mins}m ${secs}s`
  }

  const timeAgo = (dateStr: string) => {
    const then = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z')
    const estTime = then.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    const now = new Date()
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000)
    if (diff < 0) return estTime
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return estTime.split(', ').pop() || estTime
    return estTime
  }

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM'
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return '12 PM'
    return `${hour - 12} PM`
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
    if (s.includes('facebook') || s.includes('fb')) return '👤'
    if (s.includes('instagram')) return '📷'
    if (s.includes('twitter') || s.includes('x.com')) return '🐦'
    if (s.includes('yelp')) return '⭐'
    return '🌐'
  }

  const getDeviceIcon = (device: string) => {
    const d = device.toLowerCase()
    if (d.includes('mobile') || d.includes('phone') || d.includes('iphone') || d.includes('android')) return '📱'
    if (d.includes('tablet') || d.includes('ipad')) return '📋'
    return '💻'
  }

  const maxHourlyVisits = data?.hourlyTraffic
    ? Math.max(...data.hourlyTraffic.map(h => h.visits), 1)
    : 1

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader currentPage="analytics" />

      <main className="p-3 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-[#1E2A4A]">Site Analytics</h2>
            <p className="text-gray-500 text-sm">thenycmaid.com visitor behavior</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex gap-1">
              {([
                { key: 'today', label: 'Today' },
                { key: '7d', label: '7 Days' },
                { key: '30d', label: '30 Days' },
                { key: 'all', label: 'All Time' },
              ] as { key: TimePeriod; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    period === key
                      ? 'bg-[#1E2A4A] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-[#1E2A4A] text-white rounded-lg hover:bg-[#1E2A4A]/90 text-sm"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12 text-gray-500">Loading analytics...</div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-[#1E2A4A] text-white rounded-lg hover:bg-[#1E2A4A]/90 text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Data Display */}
        {data && !loading && !error && (
          <>
            {/* ========== OVERVIEW CARDS ========== */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <div className="bg-[#A8F0DC]/20 rounded-lg p-4 border border-[#A8F0DC]/30">
                <p className="text-sm text-[#1E2A4A]/70">Total Visitors</p>
                <p className="text-2xl font-bold text-[#1E2A4A]">
                  {period === 'today' ? data.overview.todayVisitors
                    : period === '7d' ? data.overview.weekVisitors
                    : period === '30d' ? data.overview.monthVisitors
                    : data.overview.monthVisitors}
                </p>
                <div className="text-xs text-[#1E2A4A]/50 mt-1">
                  <span>Today: {data.overview.todayVisitors}</span>
                  <span className="mx-1">|</span>
                  <span>7d: {data.overview.weekVisitors}</span>
                  <span className="mx-1">|</span>
                  <span>30d: {data.overview.monthVisitors}</span>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                <p className="text-sm text-indigo-600">Unique Visitors</p>
                <p className="text-2xl font-bold text-indigo-700">{data.overview.uniqueVisitors}</p>
                <p className="text-xs text-indigo-400 mt-1">distinct sessions</p>
              </div>

              <div className="bg-violet-50 rounded-lg p-4 border border-violet-100">
                <p className="text-sm text-violet-600">Avg Time on Page</p>
                <p className="text-2xl font-bold text-violet-700">{formatTime(data.overview.avgTime)}</p>
                <p className="text-xs text-violet-400 mt-1">{Math.round(data.overview.avgTime)}s average</p>
              </div>

              <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-100">
                <p className="text-sm text-cyan-600">Avg Scroll Depth</p>
                <p className="text-2xl font-bold text-cyan-700">{Math.round(data.overview.avgScroll)}%</p>
                <p className="text-xs text-cyan-400 mt-1">of page viewed</p>
              </div>

              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                <p className="text-sm text-amber-600">Bounce Rate</p>
                <p className="text-2xl font-bold text-amber-700">{Math.round(data.overview.bounceRate)}%</p>
                <p className="text-xs text-amber-400 mt-1">single-page sessions</p>
              </div>

              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                <p className="text-sm text-emerald-600">CTA Conversion</p>
                <p className="text-2xl font-bold text-emerald-700">{data.overview.ctaRate.toFixed(1)}%</p>
                <p className="text-xs text-emerald-400 mt-1">visitors who clicked CTA</p>
              </div>
            </div>

            {/* ========== FORM FUNNELS ========== */}
            {data.formFunnels && (
              <div className="bg-white border rounded-lg mb-8">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-[#1E2A4A]">Form Funnels</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-px bg-gray-100">
                  {data.formFunnels.map(funnel => {
                    const total = funnel.starts || 1
                    return (
                      <div key={funnel.page} className="bg-white p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-[#1E2A4A]">{funnel.label}</h4>
                          <span className={`text-lg font-bold ${funnel.rate >= 50 ? 'text-green-600' : funnel.rate >= 25 ? 'text-yellow-600' : funnel.rate > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                            {funnel.rate}%
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Started</span>
                            <span className="font-medium text-[#1E2A4A]">{funnel.starts}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Completed</span>
                            <span className="font-medium text-green-600">{funnel.successes}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Abandoned</span>
                            <span className="font-medium text-red-500">{funnel.abandons}</span>
                          </div>
                        </div>
                        {/* Funnel bar */}
                        <div className="mt-3 flex h-2.5 rounded-full overflow-hidden bg-gray-100">
                          {funnel.successes > 0 && (
                            <div className="bg-green-400" style={{ width: `${(funnel.successes / total) * 100}%` }} />
                          )}
                          {funnel.abandons > 0 && (
                            <div className="bg-red-300" style={{ width: `${(funnel.abandons / total) * 100}%` }} />
                          )}
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                          <span>Completed</span>
                          <span>Abandoned</span>
                        </div>
                        {/* Step breakdown for booking form */}
                        {funnel.steps && funnel.steps.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400 mb-2">Step Breakdown</p>
                            <div className="space-y-1.5">
                              {funnel.steps.map(s => {
                                const stepLabels: Record<number, string> = { 1: 'Info', 2: 'Details', 3: 'Date/Time', 4: 'Submitted' }
                                const pct = total > 0 ? Math.round((s.count / total) * 100) : 0
                                return (
                                  <div key={s.step} className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 w-16 flex-shrink-0">{stepLabels[s.step] || `Step ${s.step}`}</span>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-[#1E2A4A]/60 rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-xs text-gray-500 w-8 text-right">{s.count}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ========== TRAFFIC SOURCES ========== */}
            <div className="bg-white border rounded-lg mb-8">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-[#1E2A4A]">Traffic Sources</h3>
              </div>
              {data.trafficSources.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">No traffic source data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200 text-left text-sm text-[#1E2A4A]">
                      <tr>
                        <th className="px-4 py-3">Source</th>
                        <th className="px-4 py-3 text-right">Visits</th>
                        <th className="px-4 py-3 text-right">% of Total</th>
                        <th className="px-4 py-3 w-48"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.trafficSources.map((source, i) => (
                        <tr key={source.source} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-4 py-3 text-sm">
                            <span className="mr-2">{getSourceIcon(source.source)}</span>
                            <span className="text-[#1E2A4A] font-medium">{source.source}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700 font-medium">{source.visits}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-500">{source.percent}%</td>
                          <td className="px-4 py-3">
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                              <div
                                className="bg-[#1E2A4A] h-2.5 rounded-full"
                                style={{ width: `${Math.min(source.percent, 100)}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ========== TOP ENTRY PAGES ========== */}
            <div className="bg-white border rounded-lg mb-8">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-[#1E2A4A]">Top Entry Pages</h3>
              </div>
              {data.topPages.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">No page data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200 text-left text-sm text-[#1E2A4A]">
                      <tr>
                        <th className="px-4 py-3">Page Path</th>
                        <th className="px-4 py-3 text-right">Visits</th>
                        <th className="px-4 py-3 text-right">Avg Time</th>
                        <th className="px-4 py-3 text-right">Avg Scroll</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.topPages.map((page, i) => (
                        <tr key={page.page} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-4 py-3 text-sm">
                            <span className="text-[#1E2A4A] font-medium font-mono">{page.page}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-700">{page.visits}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-500">{formatTime(page.avgTime)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-500">{Math.round(page.avgScroll)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ========== DEVICE BREAKDOWN + USER JOURNEY ========== */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Device Breakdown */}
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-[#1E2A4A]">Device Breakdown</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-3xl mb-1">📱</p>
                      <p className="text-2xl font-bold text-[#1E2A4A]">{Math.round(data.devices.mobile)}%</p>
                      <p className="text-sm text-gray-500">Mobile</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-3xl mb-1">💻</p>
                      <p className="text-2xl font-bold text-[#1E2A4A]">{Math.round(data.devices.desktop)}%</p>
                      <p className="text-sm text-gray-500">Desktop</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-3xl mb-1">📋</p>
                      <p className="text-2xl font-bold text-[#1E2A4A]">{Math.round(data.devices.tablet)}%</p>
                      <p className="text-sm text-gray-500">Tablet</p>
                    </div>
                  </div>
                  {/* Device bar */}
                  <div className="mt-4 flex h-4 rounded-full overflow-hidden">
                    <div className="bg-blue-400" style={{ width: `${data.devices.mobile}%` }} title={`Mobile: ${data.devices.mobile}%`} />
                    <div className="bg-purple-400" style={{ width: `${data.devices.desktop}%` }} title={`Desktop: ${data.devices.desktop}%`} />
                    <div className="bg-orange-400" style={{ width: `${data.devices.tablet}%` }} title={`Tablet: ${data.devices.tablet}%`} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Mobile</span>
                    <span>Desktop</span>
                    <span>Tablet</span>
                  </div>
                </div>
              </div>

              {/* User Journey */}
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-[#1E2A4A]">User Journey</h3>
                </div>
                <div className="p-6">
                  <div className="bg-[#A8F0DC]/20 rounded-lg p-4 mb-4 border border-[#A8F0DC]/30">
                    <p className="text-sm text-[#1E2A4A]/70">Avg Pages per Session</p>
                    <p className="text-3xl font-bold text-[#1E2A4A]">{data.journey.avgPagesPerSession.toFixed(1)}</p>
                  </div>
                  <h4 className="text-sm font-medium text-[#1E2A4A] mb-3">Top Page Flows</h4>
                  {data.journey.topFlows.length === 0 ? (
                    <p className="text-sm text-gray-500">No multi-page sessions recorded yet</p>
                  ) : (
                    <div className="space-y-2">
                      {data.journey.topFlows.map((flow, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                          <span className="text-gray-400 w-5 text-right">{i + 1}.</span>
                          <span className="text-[#1E2A4A] font-mono text-xs truncate">{flow.from}</span>
                          <span className="text-gray-400 flex-shrink-0">→</span>
                          <span className="text-[#1E2A4A] font-mono text-xs truncate">{flow.to}</span>
                          <span className="ml-auto font-medium text-gray-600 flex-shrink-0">{flow.count}x</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ========== HOURLY TRAFFIC ========== */}
            <div className="bg-white border rounded-lg mb-8">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-[#1E2A4A]">Hourly Traffic (Today)</h3>
              </div>
              <div className="p-4">
                {data.hourlyTraffic.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No hourly data available</p>
                ) : (
                  <div className="space-y-1">
                    {data.hourlyTraffic.map((h) => {
                      const barWidth = maxHourlyVisits > 0
                        ? Math.max((h.visits / maxHourlyVisits) * 100, 0)
                        : 0
                      const now = new Date()
                      const currentHour = now.getHours()
                      const isCurrentHour = h.hour === currentHour

                      return (
                        <div key={h.hour} className={`flex items-center gap-3 py-1 px-2 rounded ${isCurrentHour ? 'bg-[#A8F0DC]/20' : ''}`}>
                          <span className={`text-xs w-14 text-right flex-shrink-0 font-mono ${isCurrentHour ? 'font-bold text-[#1E2A4A]' : 'text-gray-400'}`}>
                            {formatHour(h.hour)}
                          </span>
                          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                            {h.visits > 0 && (
                              <div
                                className={`h-full rounded-full transition-all ${isCurrentHour ? 'bg-[#A8F0DC]' : 'bg-[#1E2A4A]/60'}`}
                                style={{ width: `${barWidth}%` }}
                              />
                            )}
                          </div>
                          <span className={`text-xs w-8 text-right flex-shrink-0 ${isCurrentHour ? 'font-bold text-[#1E2A4A]' : h.visits > 0 ? 'text-gray-600' : 'text-gray-300'}`}>
                            {h.visits}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ========== RECENT VISITORS ========== */}
            <div className="bg-white border rounded-lg mb-8">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold text-[#1E2A4A]">Recent Visitors</h3>
                <span className="text-sm text-gray-400">Last 50 visits</span>
              </div>
              {data.recentVisitors.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">No recent visitor data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50 border-b border-gray-200 text-left text-sm text-[#1E2A4A]">
                      <tr>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Page</th>
                        <th className="px-4 py-3">Referrer</th>
                        <th className="px-4 py-3">Device</th>
                        <th className="px-4 py-3 text-right">Time on Page</th>
                        <th className="px-4 py-3 text-right">Scroll Depth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.recentVisitors.map((visitor, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {timeAgo(visitor.time)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="text-[#1E2A4A] font-mono text-xs">{visitor.page}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate" title={visitor.referrer || 'direct'}>
                            {visitor.referrer ? (
                              <span className="flex items-center gap-1">
                                <span>{getSourceIcon(visitor.referrer)}</span>
                                <span>{visitor.referrer}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400">direct</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <span>{getDeviceIcon(visitor.device)}</span>
                              <span>{visitor.device}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">{formatTime(visitor.time_on_page)}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            <span className={
                              visitor.scroll_depth >= 75 ? 'text-green-600 font-medium' :
                              visitor.scroll_depth >= 50 ? 'text-yellow-600' :
                              visitor.scroll_depth >= 25 ? 'text-orange-600' :
                              'text-gray-400'
                            }>
                              {Math.round(visitor.scroll_depth)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
