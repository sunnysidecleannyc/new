'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardHeader from '@/components/DashboardHeader'

type TabId = 'business' | 'services' | 'scheduling' | 'referrals' | 'notifications' | 'tools'

interface ServiceType {
  name: string
  default_hours: number
  active: boolean
}

interface Settings {
  business_name: string
  business_phone: string
  business_email: string
  business_website: string
  admin_email: string
  email_from_name: string
  email_from_address: string
  service_types: ServiceType[]
  standard_rate: number
  budget_rate: number
  payment_methods: string[]
  business_hours_start: number
  business_hours_end: number
  booking_buffer_minutes: number
  default_duration_hours: number
  min_days_ahead: number
  allow_same_day: boolean
  commission_rate: number
  attribution_window_hours: number
  active_client_threshold_days: number
  at_risk_threshold_days: number
  reschedule_notice_recurring_days: number
  reschedule_notice_onetime_hours: number
  reminder_days: number[]
  reminder_hours_before: number
  daily_summary_enabled: boolean
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'business', label: 'Business' },
  { id: 'services', label: 'Services & Pricing' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'referrals', label: 'Referrals & Policies' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'tools', label: 'Tools' },
]

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'apple_pay', label: 'Apple Pay' },
  { value: 'check', label: 'Check' },
]

export default function SettingsPage() {
  useEffect(() => { document.title = 'Settings | The NYC Maid' }, [])

  const [activeTab, setActiveTab] = useState<TabId>('business')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Service type modal
  const [serviceModal, setServiceModal] = useState<{ open: boolean; index: number | null; name: string; hours: number; active: boolean }>({
    open: false, index: null, name: '', hours: 2, active: true,
  })

  // Reminder days input
  const [reminderInput, setReminderInput] = useState('')

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to load settings')
      const data = await res.json()
      setSettings(data)
      setLoadError(null)
    } catch {
      setLoadError('Failed to load settings. Make sure the settings table exists in Supabase.')
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const saveSettings = async (fields: Partial<Settings>) => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }
      const data = await res.json()
      setSettings(data)
      showMessage('success', 'Settings saved')
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to save settings')
    }
    setSaving(false)
  }

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }

  // --- Tool triggers (kept from original) ---
  const runTool = async (endpoint: string, toolId: string, successMsg: string) => {
    setLoading(toolId)
    try {
      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showMessage('success', successMsg.replace('{count}', data.count || data.results?.length || '0'))
      } else {
        showMessage('error', data.error || `Failed to run ${toolId}`)
      }
    } catch {
      showMessage('error', `Failed to run ${toolId}`)
    }
    setLoading(null)
  }

  // --- Reminder days tag management ---
  const addReminderDay = () => {
    if (!settings) return
    const num = parseInt(reminderInput)
    if (isNaN(num) || num <= 0) return
    if (settings.reminder_days.includes(num)) return
    const newDays = [...settings.reminder_days, num].sort((a, b) => b - a)
    update('reminder_days', newDays)
    setReminderInput('')
  }

  const removeReminderDay = (day: number) => {
    if (!settings) return
    update('reminder_days', settings.reminder_days.filter(d => d !== day))
  }

  // --- Service type modal handlers ---
  const openAddService = () => {
    setServiceModal({ open: true, index: null, name: '', hours: 2, active: true })
  }

  const openEditService = (index: number) => {
    if (!settings) return
    const s = settings.service_types[index]
    setServiceModal({ open: true, index, name: s.name, hours: s.default_hours, active: s.active })
  }

  const saveService = () => {
    if (!settings || !serviceModal.name.trim()) return
    const types = [...settings.service_types]
    const entry: ServiceType = { name: serviceModal.name.trim(), default_hours: serviceModal.hours, active: serviceModal.active }
    if (serviceModal.index !== null) {
      types[serviceModal.index] = entry
    } else {
      types.push(entry)
    }
    update('service_types', types)
    setServiceModal({ open: false, index: null, name: '', hours: 2, active: true })
  }

  const deleteService = (index: number) => {
    if (!settings) return
    if (!confirm(`Delete "${settings.service_types[index].name}"?`)) return
    const types = settings.service_types.filter((_, i) => i !== index)
    update('service_types', types)
  }

  // --- Payment methods toggle ---
  const togglePayment = (method: string) => {
    if (!settings) return
    const methods = settings.payment_methods.includes(method)
      ? settings.payment_methods.filter(m => m !== method)
      : [...settings.payment_methods, method]
    update('payment_methods', methods)
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-white">
        <DashboardHeader currentPage="settings" />
        <main className="p-3 md:p-6 max-w-5xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
            <h2 className="font-semibold mb-2">Settings Error</h2>
            <p className="mb-4">{loadError}</p>
            <p className="text-sm">Run the settings table SQL in your Supabase dashboard, then refresh this page.</p>
          </div>
        </main>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-white">
        <DashboardHeader currentPage="settings" />
        <main className="p-3 md:p-6 max-w-5xl mx-auto">
          <div className="text-gray-500">Loading settings...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader currentPage="settings" />

      <main className="p-3 md:p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[#1E2A4A]">Settings</h2>
          <p className="text-gray-500">Manage your business settings and tools</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-4 mb-6 border-b flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 transition ${activeTab === tab.id ? 'border-b-2 border-[#1E2A4A] font-semibold' : 'text-gray-500 hover:text-[#1E2A4A]'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ====== TAB 1: BUSINESS ====== */}
        {activeTab === 'business' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-[#1E2A4A] mb-4">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Business Name" value={settings.business_name} onChange={v => update('business_name', v)} />
                <Field label="Phone" value={settings.business_phone} onChange={v => update('business_phone', v)} />
                <Field label="Business Email" value={settings.business_email} onChange={v => update('business_email', v)} type="email" />
                <Field label="Website" value={settings.business_website} onChange={v => update('business_website', v)} type="url" />
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-[#1E2A4A] mb-4">Email Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Admin Email" value={settings.admin_email} onChange={v => update('admin_email', v)} type="email" hint="Receives admin notifications & backups" />
                <Field label="Email From Name" value={settings.email_from_name} onChange={v => update('email_from_name', v)} hint="Display name on outgoing emails" />
                <Field label="Email From Address" value={settings.email_from_address} onChange={v => update('email_from_address', v)} type="email" hint="Sender address for outgoing emails" />
              </div>
            </div>

            <SaveButton saving={saving} onClick={() => saveSettings({
              business_name: settings.business_name,
              business_phone: settings.business_phone,
              business_email: settings.business_email,
              business_website: settings.business_website,
              admin_email: settings.admin_email,
              email_from_name: settings.email_from_name,
              email_from_address: settings.email_from_address,
            })} />
          </div>
        )}

        {/* ====== TAB 2: SERVICES & PRICING ====== */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-[#1E2A4A]">Service Types</h2>
                <button onClick={openAddService} className="px-3 py-1 text-sm bg-[#1E2A4A] text-white rounded-lg hover:bg-[#1E2A4A]/90">+ Add Service</button>
              </div>
              <div className="space-y-3">
                {settings.service_types.map((service, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${service.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-[#1E2A4A] font-medium">{service.name}</span>
                      <span className="text-gray-400 text-sm">{service.default_hours}h default</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditService(i)} className="text-gray-400 hover:text-[#1E2A4A] text-sm">Edit</button>
                      <button onClick={() => deleteService(i)} className="text-gray-400 hover:text-red-600 text-sm">Delete</button>
                    </div>
                  </div>
                ))}
                {settings.service_types.length === 0 && (
                  <p className="text-gray-400 text-sm py-4 text-center">No service types configured</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-[#1E2A4A] mb-4">Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Standard Rate</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-gray-100 border border-r-0 rounded-l-lg text-gray-500">$</span>
                    <input type="number" value={settings.standard_rate} onChange={e => update('standard_rate', Number(e.target.value))} className="w-full px-3 py-2 border rounded-r-lg text-[#1E2A4A]" />
                    <span className="ml-2 text-gray-500 whitespace-nowrap">/hr</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Budget Rate (BYOS)</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-gray-100 border border-r-0 rounded-l-lg text-gray-500">$</span>
                    <input type="number" value={settings.budget_rate} onChange={e => update('budget_rate', Number(e.target.value))} className="w-full px-3 py-2 border rounded-r-lg text-[#1E2A4A]" />
                    <span className="ml-2 text-gray-500 whitespace-nowrap">/hr</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-[#1E2A4A] mb-4">Payment Methods</h2>
              <div className="flex flex-wrap gap-3">
                {PAYMENT_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={settings.payment_methods.includes(opt.value)}
                      onChange={() => togglePayment(opt.value)}
                      className="accent-black"
                    />
                    <span className="text-[#1E2A4A] text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <SaveButton saving={saving} onClick={() => saveSettings({
              service_types: settings.service_types,
              standard_rate: settings.standard_rate,
              budget_rate: settings.budget_rate,
              payment_methods: settings.payment_methods,
            })} />
          </div>
        )}

        {/* ====== TAB 3: SCHEDULING ====== */}
        {activeTab === 'scheduling' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-[#1E2A4A] mb-4">Business Hours</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Start Hour</label>
                  <select value={settings.business_hours_start} onChange={e => update('business_hours_start', Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-[#1E2A4A]">
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{formatHour(i)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">End Hour</label>
                  <select value={settings.business_hours_end} onChange={e => update('business_hours_end', Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-[#1E2A4A]">
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{formatHour(i)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-[#1E2A4A] mb-4">Booking Rules</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberField label="Booking Buffer" value={settings.booking_buffer_minutes} onChange={v => update('booking_buffer_minutes', v)} suffix="minutes" hint="Time between bookings" />
                <NumberField label="Default Duration" value={settings.default_duration_hours} onChange={v => update('default_duration_hours', v)} suffix="hours" />
                <NumberField label="Min Days Ahead" value={settings.min_days_ahead} onChange={v => update('min_days_ahead', v)} suffix="days" hint="How far ahead clients must book" />
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Same-Day Bookings</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" checked={settings.allow_same_day} onChange={e => update('allow_same_day', e.target.checked)} className="accent-black w-4 h-4" />
                    <span className="text-[#1E2A4A] text-sm">Allow same-day bookings</span>
                  </label>
                </div>
              </div>
            </div>

            <SaveButton saving={saving} onClick={() => saveSettings({
              business_hours_start: settings.business_hours_start,
              business_hours_end: settings.business_hours_end,
              booking_buffer_minutes: settings.booking_buffer_minutes,
              default_duration_hours: settings.default_duration_hours,
              min_days_ahead: settings.min_days_ahead,
              allow_same_day: settings.allow_same_day,
            })} />
          </div>
        )}

        {/* ====== TAB 4: REFERRALS & POLICIES ====== */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-[#1E2A4A] mb-4">Referral Program</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberField label="Commission Rate" value={settings.commission_rate} onChange={v => update('commission_rate', v)} suffix="%" hint="Percentage paid to referrers" />
                <NumberField label="Attribution Window" value={settings.attribution_window_hours} onChange={v => update('attribution_window_hours', v)} suffix="hours" hint="How long a referral link stays valid" />
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-[#1E2A4A] mb-4">Client Lifecycle</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberField label="Active Client Threshold" value={settings.active_client_threshold_days} onChange={v => update('active_client_threshold_days', v)} suffix="days" hint="Booked within this many days = Active" />
                <NumberField label="At-Risk Threshold" value={settings.at_risk_threshold_days} onChange={v => update('at_risk_threshold_days', v)} suffix="days" hint="No booking in this many days = At-Risk / Churned" />
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-[#1E2A4A] mb-4">Cancellation Policy</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberField label="Reschedule Notice (Recurring)" value={settings.reschedule_notice_recurring_days} onChange={v => update('reschedule_notice_recurring_days', v)} suffix="days" hint="Required notice for recurring clients" />
                <NumberField label="Reschedule Notice (One-time)" value={settings.reschedule_notice_onetime_hours} onChange={v => update('reschedule_notice_onetime_hours', v)} suffix="hours" hint="Required notice for one-time clients" />
              </div>
            </div>

            <SaveButton saving={saving} onClick={() => saveSettings({
              commission_rate: settings.commission_rate,
              attribution_window_hours: settings.attribution_window_hours,
              active_client_threshold_days: settings.active_client_threshold_days,
              at_risk_threshold_days: settings.at_risk_threshold_days,
              reschedule_notice_recurring_days: settings.reschedule_notice_recurring_days,
              reschedule_notice_onetime_hours: settings.reschedule_notice_onetime_hours,
            })} />
          </div>
        )}

        {/* ====== TAB 5: NOTIFICATIONS ====== */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-[#1E2A4A] mb-4">Reminders</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Reminder Days Before Booking</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {settings.reminder_days.map(day => (
                      <span key={day} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm text-[#1E2A4A]">
                        {day}d
                        <button onClick={() => removeReminderDay(day)} className="text-gray-400 hover:text-red-500 ml-1">&times;</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={reminderInput}
                      onChange={e => setReminderInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addReminderDay()}
                      placeholder="Add days..."
                      className="w-28 px-3 py-2 border rounded-lg text-[#1E2A4A] text-sm"
                      min={1}
                    />
                    <button onClick={addReminderDay} className="px-3 py-2 bg-gray-100 border rounded-lg text-sm text-[#1E2A4A] hover:bg-gray-200">Add</button>
                  </div>
                </div>
                <NumberField label="Hours Before (Day-of)" value={settings.reminder_hours_before} onChange={v => update('reminder_hours_before', v)} suffix="hours" hint="Reminder sent this many hours before the booking" />
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-[#1E2A4A] mb-4">Daily Summary</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.daily_summary_enabled} onChange={e => update('daily_summary_enabled', e.target.checked)} className="accent-black w-4 h-4" />
                <span className="text-[#1E2A4A] text-sm">Send daily summary to cleaners at midnight</span>
              </label>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-[#1E2A4A] mb-2">Email Templates</h2>
              <p className="text-gray-500 text-sm mb-4">Preview of all email templates sent by the system</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-[#1E2A4A]">Client Emails</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>Booking Confirmation</li>
                    <li>Reminder (Tomorrow)</li>
                    <li>Reminder (Today)</li>
                    <li>Cancellation</li>
                    <li>Verification Code</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-[#1E2A4A]">Cleaner Emails</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>Job Assignment</li>
                    <li>Daily Summary</li>
                    <li>Cancellation</li>
                    <li>Welcome</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-[#1E2A4A]">Referral Emails</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>Welcome</li>
                    <li>Commission Earned</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-[#1E2A4A]">Admin Emails</h3>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>New Booking</li>
                    <li>New Referrer</li>
                    <li>Daily Backup</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => runTool('/api/test-emails', 'test-emails', 'Sent {count} test emails to admin')}
                disabled={loading === 'test-emails'}
                className="mt-4 px-4 py-2 bg-[#1E2A4A] text-white rounded-lg hover:bg-[#1E2A4A]/90 disabled:bg-gray-300 text-sm"
              >
                {loading === 'test-emails' ? 'Sending...' : 'Send All Test Emails to Admin'}
              </button>
            </div>

            <SaveButton saving={saving} onClick={() => saveSettings({
              reminder_days: settings.reminder_days,
              reminder_hours_before: settings.reminder_hours_before,
              daily_summary_enabled: settings.daily_summary_enabled,
            })} />
          </div>
        )}

        {/* ====== TAB 6: TOOLS ====== */}
        {activeTab === 'tools' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-[#1E2A4A] mb-2">Manual Triggers</h2>
              <p className="text-gray-500 text-sm mb-4">Run scheduled tasks manually</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ToolCard
                  title="Daily Summary"
                  description="Send tomorrow schedule to all cleaners"
                  loading={loading === 'daily-summary'}
                  onClick={() => runTool('/api/cron/daily-summary', 'daily-summary', 'Daily summary emails sent')}
                />
                <ToolCard
                  title="Client Reminders"
                  description="Send reminders for upcoming bookings"
                  loading={loading === 'reminders'}
                  onClick={() => runTool('/api/cron/reminders', 'reminders', 'Sent {count} reminder emails')}
                />
                <ToolCard
                  title="Database Backup"
                  description="Export clients and bookings to CSV"
                  loading={loading === 'backup'}
                  onClick={() => runTool('/api/cron/backup', 'backup', 'Backup completed and sent to admin')}
                />
                <ToolCard
                  title="Test Emails"
                  description="Send all email templates to admin"
                  loading={loading === 'test-emails'}
                  onClick={() => runTool('/api/test-emails', 'test-emails', 'Sent {count} test emails to admin')}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-[#1E2A4A] mb-4">System Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Environment</p>
                  <p className="text-[#1E2A4A] font-medium">Production</p>
                </div>
                <div>
                  <p className="text-gray-500">Platform</p>
                  <p className="text-[#1E2A4A] font-medium">Vercel</p>
                </div>
                <div>
                  <p className="text-gray-500">Database</p>
                  <p className="text-[#1E2A4A] font-medium">Supabase</p>
                </div>
                <div>
                  <p className="text-gray-500">Email Provider</p>
                  <p className="text-[#1E2A4A] font-medium">Resend</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Service Type Modal */}
      {serviceModal.open && (
        <div className="fixed inset-0 bg-[#1E2A4A]/50 z-50 flex items-center justify-center p-4" onClick={() => setServiceModal(s => ({ ...s, open: false }))}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[#1E2A4A] mb-4">{serviceModal.index !== null ? 'Edit Service' : 'Add Service'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Service Name</label>
                <input
                  type="text"
                  value={serviceModal.name}
                  onChange={e => setServiceModal(s => ({ ...s, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-[#1E2A4A]"
                  placeholder="e.g. Deep Cleaning"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Default Hours</label>
                <input
                  type="number"
                  value={serviceModal.hours}
                  onChange={e => setServiceModal(s => ({ ...s, hours: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg text-[#1E2A4A]"
                  min={1}
                  step={0.5}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={serviceModal.active}
                  onChange={e => setServiceModal(s => ({ ...s, active: e.target.checked }))}
                  className="accent-black w-4 h-4"
                />
                <span className="text-[#1E2A4A] text-sm">Active</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setServiceModal(s => ({ ...s, open: false }))} className="px-4 py-2 border rounded-lg text-[#1E2A4A] hover:bg-gray-50">Cancel</button>
              <button onClick={saveService} className="px-4 py-2 bg-[#1E2A4A] text-white rounded-lg hover:bg-[#1E2A4A]/90">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Reusable sub-components ---

function Field({ label, value, onChange, type = 'text', hint }: { label: string; value: string; onChange: (v: string) => void; type?: string; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-[#1E2A4A]" />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function NumberField({ label, value, onChange, suffix, hint }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex items-center">
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-[#1E2A4A]" />
        {suffix && <span className="ml-2 text-gray-500 whitespace-nowrap">{suffix}</span>}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <button onClick={onClick} disabled={saving} className="px-6 py-2 bg-[#1E2A4A] text-white rounded-lg hover:bg-[#1E2A4A]/90 disabled:bg-gray-300 font-medium">
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}

function ToolCard({ title, description, loading, onClick }: { title: string; description: string; loading: boolean; onClick: () => void }) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-medium text-[#1E2A4A]">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 mb-3">{description}</p>
      <button onClick={onClick} disabled={loading} className="px-3 py-2 bg-[#1E2A4A] text-white rounded-lg text-sm hover:bg-[#1E2A4A]/90 disabled:bg-gray-300">
        {loading ? 'Running...' : 'Run Now'}
      </button>
    </div>
  )
}

function formatHour(h: number): string {
  if (h === 0) return '12:00 AM'
  if (h === 12) return '12:00 PM'
  if (h < 12) return `${h}:00 AM`
  return `${h - 12}:00 PM`
}
