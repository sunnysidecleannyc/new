'use client'

import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/DashboardHeader'

interface Referrer {
  id: string
  name: string
  email: string
  phone: string
  ref_code: string
  zelle_email: string
  zelle_phone: string
  apple_cash_phone: string
  preferred_payout: string
  total_earned: number
  total_paid: number
  active: boolean
  created_at: string
}

interface Commission {
  id: string
  booking_id: string
  referrer_id: string
  client_name: string
  gross_amount: number
  commission_rate: number
  commission_amount: number
  status: string
  paid_via: string
  paid_at: string
  created_at: string
  referrers: { name: string; email: string; ref_code: string }
  bookings: { start_time: string; price: number }
}

interface Analytics {
  overview: {
    totalClicks: number
    weekClicks: number
    monthClicks: number
    bookClicks: number
    callClicks: number
    uniqueVisitors: number
    totalReferredBookings: number
    completedReferredBookings: number
    referredRevenue: number
    conversionRate: string
  }
  topReferrers: Array<{
    name: string
    ref_code: string
    clicks: number
    bookClicks: number
    bookings: number
    earned: number
  }>
  recentActivity: Array<{
    ref_code: string
    action: string
    device: string
    page: string
    time: string
  }>
  dailyClicks: Array<{ date: string; clicks: number }>
}

export default function ReferralsPage() {
  useEffect(() => { document.title = 'Referrals | The NYC Maid' }, []);
  const [referrers, setReferrers] = useState<Referrer[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'analytics' | 'payouts' | 'referrers'>('analytics')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newReferrer, setNewReferrer] = useState({
    name: '', email: '', phone: '', zelle_email: '', preferred_payout: 'zelle'
  })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    // Fetch independently so one failure doesn't break the others
    try {
      const refRes = await fetch('/api/referrers')
      if (refRes.ok) setReferrers(await refRes.json())
    } catch (err) { console.error('Failed to fetch referrers:', err) }

    try {
      const commRes = await fetch('/api/referral-commissions')
      if (commRes.ok) setCommissions(await commRes.json())
    } catch (err) { console.error('Failed to fetch commissions:', err) }

    try {
      const analyticsRes = await fetch('/api/referrers/analytics')
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setAnalytics(analyticsData.overview ? analyticsData : null)
      }
    } catch (err) { console.error('Failed to fetch analytics:', err) }

    setLoading(false)
  }

  const addReferrer = async () => {
    try {
      const res = await fetch('/api/referrers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReferrer)
      })
      if (res.ok) {
        setShowAddForm(false)
        setNewReferrer({ name: '', email: '', phone: '', zelle_email: '', preferred_payout: 'zelle' })
        fetchData()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to add referrer')
      }
    } catch (err) {
      console.error('Failed to add referrer:', err)
    }
  }

  const markPaid = async (commissionId: string, paidVia: string) => {
    try {
      const res = await fetch('/api/referral-commissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: commissionId, status: 'paid', paid_via: paidVia })
      })
      if (res.ok) fetchData()
    } catch (err) {
      console.error('Failed to mark paid:', err)
    }
  }

  const copyLink = (refCode: string) => {
    navigator.clipboard.writeText(`https://www.thenycmaid.com/book?ref=${refCode}`)
    alert('Link copied!')
  }

  const formatMoney = (cents: number) => '$' + (cents / 100).toFixed(2)
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  const formatTimeAgo = (dateStr: string) => {
    // Supabase timestamps are UTC — append Z if not present
    const ts = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
    const diffMs = Date.now() - new Date(ts).getTime()
    if (diffMs < 0) return 'just now'
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    if (diffMins < 60) return diffMins + 'm ago'
    if (diffHours < 24) return diffHours + 'h ago'
    return Math.floor(diffHours / 24) + 'd ago'
  }

  const pendingCommissions = commissions.filter(c => c.status === 'pending')
  const paidCommissions = commissions.filter(c => c.status === 'paid')
  const totalPending = pendingCommissions.reduce((sum, c) => sum + c.commission_amount, 0)

  // Mini bar chart
  const maxDailyClicks = analytics ? Math.max(...analytics.dailyClicks.map(d => d.clicks), 1) : 1

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader currentPage="referrals" />

      <main className="p-3 md:p-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-2xl font-semibold text-[#1E2A4A]">Referral Program</h2>
            <p className="text-gray-500">{referrers.length} referrers · {pendingCommissions.length} pending payouts</p>
          </div>
          <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-[#1E2A4A] text-white rounded-lg hover:bg-[#1E2A4A]/90">
            + Add Referrer
          </button>
        </div>
        <div className="text-sm text-gray-500 mb-6">
          Referral signup: <a href="https://www.thenycmaid.com/referral/signup" target="_blank" className="text-[#1E2A4A] hover:underline">thenycmaid.com/referral/signup</a> ·
          Referral portal: <a href="https://www.thenycmaid.com/referral" target="_blank" className="text-[#1E2A4A] hover:underline ml-1">thenycmaid.com/referral</a>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button onClick={() => setActiveTab('analytics')} className={`pb-3 px-1 ${activeTab === 'analytics' ? 'border-b-2 border-[#1E2A4A] font-semibold' : 'text-gray-500'}`}>
            Analytics
          </button>
          <button onClick={() => setActiveTab('payouts')} className={`pb-3 px-1 ${activeTab === 'payouts' ? 'border-b-2 border-[#1E2A4A] font-semibold' : 'text-gray-500'}`}>
            Payout Queue ({pendingCommissions.length})
          </button>
          <button onClick={() => setActiveTab('referrers')} className={`pb-3 px-1 ${activeTab === 'referrers' ? 'border-b-2 border-[#1E2A4A] font-semibold' : 'text-gray-500'}`}>
            Referrers ({referrers.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : activeTab === 'analytics' ? (
          <>
            {/* Analytics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-[#A8F0DC]/20 rounded-xl p-4 border border-[#A8F0DC]/30">
                <p className="text-sm text-[#1E2A4A]">Total Clicks</p>
                <p className="text-2xl font-bold text-[#1E2A4A]/70">{analytics?.overview.totalClicks || 0}</p>
                <p className="text-xs text-[#1E2A4A]/70">all time</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                <p className="text-sm text-indigo-600">This Week</p>
                <p className="text-2xl font-bold text-indigo-700">{analytics?.overview.weekClicks || 0}</p>
                <p className="text-xs text-indigo-500">clicks</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <p className="text-sm text-orange-600">Book Clicks</p>
                <p className="text-2xl font-bold text-orange-700">{analytics?.overview.bookClicks || 0}</p>
                <p className="text-xs text-orange-500">🔥 hot leads</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <p className="text-sm text-purple-600">Unique Visitors</p>
                <p className="text-2xl font-bold text-purple-700">{analytics?.overview.uniqueVisitors || 0}</p>
                <p className="text-xs text-purple-500">people</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-sm text-green-600">Bookings</p>
                <p className="text-2xl font-bold text-green-700">{analytics?.overview.totalReferredBookings || 0}</p>
                <p className="text-xs text-green-500">from referrals</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-sm text-emerald-600">Revenue</p>
                <p className="text-2xl font-bold text-emerald-700">{formatMoney(analytics?.overview.referredRevenue || 0)}</p>
                <p className="text-xs text-emerald-500">from referrals</p>
              </div>
            </div>

            {/* Click Chart */}
            {analytics && analytics.dailyClicks.length > 0 && (
              <div className="bg-white border rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-[#1E2A4A] mb-4">📊 Clicks (Last 14 Days)</h3>
                <div className="flex items-end gap-1 h-32">
                  {analytics.dailyClicks.map((d, i) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-[#A8F0DC] rounded-t transition-all hover:bg-[#1E2A4A]"
                        style={{ height: `${(d.clicks / maxDailyClicks) * 100}%`, minHeight: d.clicks > 0 ? '4px' : '0' }}
                        title={`${d.date}: ${d.clicks} clicks`}
                      />
                      {i % 2 === 0 && (
                        <p className="text-xs text-gray-400 mt-1">{new Date(d.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Referrers */}
              <div className="bg-white border rounded-xl">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-[#1E2A4A]">🏆 Top Referrers by Clicks</h3>
                </div>
                <div className="divide-y">
                  {analytics?.topReferrers.length === 0 ? (
                    <p className="p-4 text-gray-500 text-sm">No referral clicks yet</p>
                  ) : (
                    analytics?.topReferrers.map((r, i) => (
                      <div key={r.ref_code} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'}`}>
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-medium text-[#1E2A4A]">{r.name}</p>
                            <p className="text-xs text-gray-500">{r.ref_code}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#1E2A4A]">{r.clicks} clicks</p>
                          <p className="text-xs text-gray-500">{r.bookings} bookings · {formatMoney(r.earned)} earned</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white border rounded-xl">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-[#1E2A4A]">⚡ Recent Activity</h3>
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {analytics?.recentActivity.length === 0 ? (
                    <p className="p-4 text-gray-500 text-sm">No recent activity</p>
                  ) : (
                    analytics?.recentActivity.map((a, i) => (
                      <div key={i} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${a.action === 'book' ? 'bg-orange-100' : a.action === 'call' ? 'bg-green-100' : 'bg-gray-100'}`}>
                            {a.action === 'book' ? '🔥' : a.action === 'call' ? '📞' : '👀'}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-[#1E2A4A]">
                              {a.action === 'book' ? 'Book click' : a.action === 'call' ? 'Call click' : 'Page view'}
                            </p>
                            <p className="text-xs text-gray-500">{a.ref_code} · {a.device} · {a.page}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{formatTimeAgo(a.time)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'payouts' ? (
          <>
            {/* Pending Payouts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Referrers</p>
                <p className="text-2xl font-bold text-[#1E2A4A]">{referrers.filter(r => r.active).length}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-600">Pending Payouts</p>
                <p className="text-2xl font-bold text-yellow-700">{formatMoney(totalPending)}</p>
                <p className="text-xs text-yellow-600">{pendingCommissions.length} commissions</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-700">{formatMoney(referrers.reduce((sum, r) => sum + r.total_paid, 0))}</p>
              </div>
              <div className="bg-[#A8F0DC]/20 rounded-lg p-4">
                <p className="text-sm text-[#1E2A4A]">Total Earned</p>
                <p className="text-2xl font-bold text-[#1E2A4A]/70">{formatMoney(referrers.reduce((sum, r) => sum + r.total_earned, 0))}</p>
              </div>
            </div>

            {pendingCommissions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No pending payouts 🎉</div>
            ) : (
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b bg-yellow-50">
                  <h3 className="font-semibold text-[#1E2A4A]">⏳ Pending Payouts</h3>
                </div>
                <div className="divide-y">
                  {pendingCommissions.map(comm => (
                    <div key={comm.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-[#1E2A4A]">{comm.referrers?.name}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-600">{comm.referrers?.ref_code}</span>
                        </div>
                        <p className="text-sm text-gray-500">{comm.client_name}'s cleaning · {formatDate(comm.created_at)}</p>
                        <p className="text-xs text-gray-400">Service: {formatMoney(comm.gross_amount)} → Commission: {formatMoney(comm.commission_amount)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-green-600">{formatMoney(comm.commission_amount)}</span>
                        <div className="flex gap-2">
                          <button onClick={() => markPaid(comm.id, 'zelle')} className="px-3 py-1 bg-[#1E2A4A] text-white rounded text-sm hover:bg-[#1E2A4A]/90">Zelle ✓</button>
                          <button onClick={() => markPaid(comm.id, 'apple_cash')} className="px-3 py-1 bg-gray-800 text-white rounded text-sm hover:bg-gray-900">Apple ✓</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {paidCommissions.length > 0 && (
              <div className="mt-6 bg-white border rounded-lg">
                <div className="p-4 border-b"><h3 className="font-semibold text-[#1E2A4A]">✅ Recently Paid</h3></div>
                <div className="divide-y max-h-64 overflow-y-auto">
                  {paidCommissions.slice(0, 10).map(comm => (
                    <div key={comm.id} className="p-4 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{comm.referrers?.name}</span>
                        <span className="text-gray-400 mx-2">·</span>
                        <span className="text-gray-600">{comm.client_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-green-600 font-medium">{formatMoney(comm.commission_amount)}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{comm.paid_via}</span>
                        <span className="text-xs text-gray-400">{comm.paid_at ? formatDate(comm.paid_at) : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Referrers Tab */
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200 text-left text-sm text-[#1E2A4A]">
                <tr>
                  <th className="px-4 py-3">Referrer</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Payout Method</th>
                  <th className="px-4 py-3">Earned</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Pending</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {referrers.map(ref => (
                  <tr key={ref.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[#1E2A4A]">{ref.name}</p>
                        <p className="text-sm text-gray-500">{ref.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-1 rounded text-sm">{ref.ref_code}</code></td>
                    <td className="px-4 py-3 text-sm">
                      {ref.preferred_payout === 'zelle' ? <span>Zelle: {ref.zelle_email || ref.zelle_phone}</span> : <span>Apple: {ref.apple_cash_phone}</span>}
                    </td>
                    <td className="px-4 py-3 text-[#1E2A4A] font-medium">{formatMoney(ref.total_earned)}</td>
                    <td className="px-4 py-3 text-green-600">{formatMoney(ref.total_paid)}</td>
                    <td className="px-4 py-3 text-yellow-600">{formatMoney(ref.total_earned - ref.total_paid)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => copyLink(ref.ref_code)} className="text-[#1E2A4A] hover:underline text-sm">Copy Link</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Add Referrer Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-[#1E2A4A]/50 flex items-center justify-center z-50" onClick={() => setShowAddForm(false)}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-semibold mb-4">Add New Referrer</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" value={newReferrer.name} onChange={(e) => setNewReferrer({ ...newReferrer, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="John Smith" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={newReferrer.email} onChange={(e) => setNewReferrer({ ...newReferrer, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="john@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={newReferrer.phone} onChange={(e) => setNewReferrer({ ...newReferrer, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="212-555-1234" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zelle Email/Phone</label>
                  <input type="text" value={newReferrer.zelle_email} onChange={(e) => setNewReferrer({ ...newReferrer, zelle_email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Same as email if blank" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Payout</label>
                  <select value={newReferrer.preferred_payout} onChange={(e) => setNewReferrer({ ...newReferrer, preferred_payout: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="zelle">Zelle</option>
                    <option value="apple_cash">Apple Cash</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button onClick={addReferrer} className="px-4 py-2 bg-[#1E2A4A] text-white rounded-lg hover:bg-[#1E2A4A]/90">Add Referrer</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
