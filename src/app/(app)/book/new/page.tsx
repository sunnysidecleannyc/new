'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { validateEmail } from '@/lib/validate-email'
import { useFormTracking } from '@/lib/useFormTracking'

interface TimeSlot { time: string; available: boolean }

function BookingFormContent() {
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref') || ''
  const srcDomain = searchParams.get('src') || ''
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [sameDayWarning, setSameDayWarning] = useState(false)
  const [emailSuggestion, setEmailSuggestion] = useState('')
  
  const { trackStart, trackStep, trackSuccess } = useFormTracking('/book/new')

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', unit: '',
    referrer_name: '', referrer_phone: '',
    hourly_rate: 75, service_type: 'Standard Cleaning', notes: '',
    date: '', time: '', recurring_type: 'none'
  })

  const serviceTypes = ['Standard Cleaning', 'Deep Cleaning', 'Move In/Out', 'Post Construction']
  const recurringOptions = [
    { value: 'none', label: 'One-time' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Every 2 weeks' },
    { value: 'monthly', label: 'Monthly' }
  ]

  const getMinDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  useEffect(() => {
    if (form.date) checkAvailability(form.date)
  }, [form.date])

  const checkAvailability = async (date: string) => {
    setCheckingAvailability(true)
    setSameDayWarning(false)
    setAvailableSlots([])
    try {
      const res = await fetch('/api/client/availability?date=' + date)
      if (res.ok) {
        const data = await res.json()
        if (data.sameDay) setSameDayWarning(true)
        else setAvailableSlots(data.slots || [])
      }
    } catch (err) { console.error(err) }
    setCheckingAvailability(false)
  }

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return '(' + cleaned.slice(0,3) + ') ' + cleaned.slice(3)
    return '(' + cleaned.slice(0,3) + ') ' + cleaned.slice(3,6) + '-' + cleaned.slice(6,10)
  }

  const validateStep1 = () => {
    if (!form.name || !form.email || !form.phone || !form.address) {
      setError('Please fill in all required fields'); return false
    }
    const emailCheck = validateEmail(form.email)
    if (!emailCheck.valid) {
      if (emailCheck.suggestion) {
        setEmailSuggestion(emailCheck.suggestion)
        setError(`Did you mean ${emailCheck.suggestion}?`)
      } else {
        setError(emailCheck.error || 'Please enter a valid email')
      }
      return false
    }
    if (form.phone.replace(/\D/g, '').length < 10) { setError('Please enter a valid phone number'); return false }
    setEmailSuggestion(''); setError(''); return true
  }

  const handleSubmit = async () => {
    if (!form.date || !form.time) { setError('Please select a date and time'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/client/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ref_code: refCode, src: srcDomain, status: 'pending' })
      })
      if (res.ok) { trackSuccess(); setSuccess(true) }
      else { const data = await res.json(); setError(data.error || 'Failed to submit') }
    } catch { setError('Something went wrong') }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-2xl font-bold text-[#1E2A4A] mb-2">Request Submitted!</h1>
          <p className="text-gray-600 mb-6">Thank you! We appreciate it and look forward to working with you. We'll review your request, assign a cleaner, and confirm your appointment shortly.</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-500">Appointment Details:</p>
            <p className="font-medium text-[#1E2A4A]">{new Date(form.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <p className="text-gray-600">{form.time}</p>
            <p className="text-gray-600">{form.service_type}</p>
          </div>
          <p className="text-xs text-gray-400">Questions? Call (212) 202-8400</p>
          <p className="text-xs text-gray-400 mt-4">📧 Please check your spam/junk folder if you don't see our email in your inbox.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1E2A4A] text-white py-4 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold">The NYC Maid</h1>
          <p className="text-gray-400 text-sm">Book Your Cleaning</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6" onFocusCapture={trackStart}>
        <div className="bg-[#A8F0DC]/20 border border-[#A8F0DC]/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-[#1E2A4A]"><strong>📅 Scheduling:</strong> Mon-Sat, 9AM - 4PM (last start time)</p>
          <p className="text-sm text-[#1E2A4A]/70 mt-1">Same-day? Call <a href="tel:2122028400" className="underline font-medium">(212) 202-8400</a></p>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className={'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ' + (step >= 1 ? 'bg-[#1E2A4A] text-white' : 'bg-gray-200 text-gray-500')}>1</div>
          <div className={'w-16 h-1 ' + (step >= 2 ? 'bg-[#1E2A4A]' : 'bg-gray-200')}></div>
          <div className={'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ' + (step >= 2 ? 'bg-[#1E2A4A] text-white' : 'bg-gray-200 text-gray-500')}>2</div>
          <div className={'w-16 h-1 ' + (step >= 3 ? 'bg-[#1E2A4A]' : 'bg-gray-200')}></div>
          <div className={'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ' + (step >= 3 ? 'bg-[#1E2A4A] text-white' : 'bg-gray-200 text-gray-500')}>3</div>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

        {step === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-[#1E2A4A] mb-6">Your Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 border rounded-lg text-[#1E2A4A] text-base" placeholder="John Smith" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setEmailSuggestion('') }} className="w-full px-4 py-3 border rounded-lg text-[#1E2A4A] text-base" placeholder="john@example.com" />
                {emailSuggestion && (
                  <button type="button" onClick={() => { setForm({ ...form, email: emailSuggestion }); setEmailSuggestion(''); setError('') }} className="mt-1 text-sm text-[#1E2A4A] hover:underline">
                    Use {emailSuggestion}?
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} className="w-full px-4 py-3 border rounded-lg text-[#1E2A4A] text-base" placeholder="(212) 555-1234" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <AddressAutocomplete value={form.address} onChange={(val) => setForm({ ...form, address: val })} placeholder="Start typing address..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apt/Unit</label>
                <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-4 py-3 border rounded-lg text-[#1E2A4A] text-base" placeholder="Apt 4B" />
              </div>
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-2">Referred by someone? <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" value={form.referrer_name} onChange={(e) => setForm({ ...form, referrer_name: e.target.value })} className="w-full px-4 py-3 border rounded-lg text-[#1E2A4A] text-base" placeholder="Their name" />
                  <input type="tel" value={form.referrer_phone} onChange={(e) => setForm({ ...form, referrer_phone: formatPhone(e.target.value) })} className="w-full px-4 py-3 border rounded-lg text-[#1E2A4A] text-base" placeholder="Their phone" />
                </div>
              </div>
            </div>
            <button onClick={() => { if (validateStep1()) { trackStep(2); setStep(2) } }} className="w-full mt-6 py-3 bg-[#1E2A4A] text-white rounded-lg font-medium hover:bg-[#1E2A4A]/90">Continue</button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-[#1E2A4A] mb-6">Service Details</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {serviceTypes.map(s => (
                    <button key={s} type="button" onClick={() => setForm({ ...form, service_type: s })} className={'p-3 rounded-lg border text-sm font-medium ' + (form.service_type === s ? 'border-[#1E2A4A] bg-[#1E2A4A] text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50')}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rate</label>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setForm({ ...form, hourly_rate: 49 })} className={'p-4 rounded-lg border text-[#1E2A4A] ' + (form.hourly_rate === 49 ? 'border-[#1E2A4A] bg-gray-100' : 'border-gray-200 hover:bg-gray-50')}>
                    <p className="text-2xl font-bold">$49<span className="text-sm font-normal">/hr</span></p>
                    <p className="text-xs mt-1 text-gray-500">You provide supplies</p>
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, hourly_rate: 75 })} className={'p-4 rounded-lg border text-[#1E2A4A] ' + (form.hourly_rate === 75 ? 'border-[#1E2A4A] bg-gray-100' : 'border-gray-200 hover:bg-gray-50')}>
                    <p className="text-2xl font-bold">$75<span className="text-sm font-normal">/hr</span></p>
                    <p className="text-xs mt-1 text-gray-500">We bring supplies</p>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <div className="grid grid-cols-2 gap-2">
                  {recurringOptions.map(r => (
                    <button key={r.value} type="button" onClick={() => setForm({ ...form, recurring_type: r.value })} className={'p-3 rounded-lg border text-sm font-medium ' + (form.recurring_type === r.value ? 'border-[#1E2A4A] bg-[#1E2A4A] text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50')}>{r.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-3 border rounded-lg text-[#1E2A4A] text-base" rows={3} placeholder="Pets, access codes, focus areas..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 text-[#1E2A4A]">Back</button>
              <button onClick={() => { trackStep(3); setStep(3) }} className="flex-1 py-3 bg-[#1E2A4A] text-white rounded-lg font-medium hover:bg-[#1E2A4A]/90">Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-[#1E2A4A] mb-6">Choose Date & Time</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value, time: '' })} min={getMinDate()} className="w-full px-4 py-3 border rounded-lg text-[#1E2A4A] text-base" />
              </div>

              {sameDayWarning && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <p className="text-yellow-800 font-medium">⚠️ Same-Day Booking</p>
                  <p className="text-yellow-700 text-sm mt-1">Same-day appointments require a phone call or text.</p>
                  <div className="flex gap-3 mt-3">
                    <a href="tel:2122028400" className="flex-1 py-2 bg-yellow-600 text-white rounded-lg text-center font-medium">📞 Call</a>
                    <a href="sms:2122028400" className="flex-1 py-2 bg-yellow-600 text-white rounded-lg text-center font-medium">💬 Text</a>
                  </div>
                </div>
              )}

              {form.date && !sameDayWarning && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Times</label>
                  {checkingAvailability ? (
                    <p className="text-gray-500 text-center py-4">Checking availability...</p>
                  ) : availableSlots.filter(s => s.available).length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No slots available. Try another day.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.filter(s => s.available).map(slot => (
                        <button key={slot.time} type="button" onClick={() => setForm({ ...form, time: slot.time })} className={'p-3 rounded-lg border text-sm font-medium min-h-[44px] ' + (form.time === slot.time ? 'border-[#1E2A4A] bg-[#1E2A4A] text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50')}>{slot.time}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
              <p className="text-sm font-medium text-gray-800">Cancellation Policy</p>
              <p className="text-sm text-gray-700 mt-1">One-time services are non-cancellable. Recurring clients (weekly, bi-weekly, monthly) require 7 days notice for cancellations. Please ensure all details are correct before confirming.</p>
            </div>

            {form.date && form.time && !sameDayWarning && (
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Booking Summary</p>
                <p className="text-[#1E2A4A]">{form.name}</p>
                <p className="text-gray-600 text-sm">{form.address}{form.unit ? ', ' + form.unit : ''}</p>
                <p className="text-gray-600 text-sm">{new Date(form.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {form.time}</p>
                <p className="text-gray-600 text-sm">{form.service_type} • ${form.hourly_rate}/hr • {recurringOptions.find(r => r.value === form.recurring_type)?.label}</p>
                {form.referrer_name && <p className="text-gray-600 text-sm">Referred by: {form.referrer_name}{form.referrer_phone ? ' (' + form.referrer_phone + ')' : ''}</p>}
              </div>
            )}

            <div className="my-5 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <label className="flex items-start gap-3 cursor-pointer text-[13px] leading-relaxed text-gray-600">
                <input type="checkbox" name="sms_consent" required className="mt-1 min-w-[18px] min-h-[18px]" />
                <span>By checking this box, I consent to receive transactional text messages from <strong>The NYC Maid</strong> for appointment confirmations, reminders, and customer support. Reply STOP to opt out. Reply HELP for help. Msg frequency may vary. Msg &amp; data rates may apply. <a href="https://www.thenycmaid.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#1E2A4A] hover:underline">Privacy Policy</a> | <a href="https://www.thenycmaid.com/terms-conditions" target="_blank" rel="noopener noreferrer" className="text-[#1E2A4A] hover:underline">Terms &amp; Conditions</a></span>
              </label>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 text-[#1E2A4A]">Back</button>
              <button onClick={handleSubmit} disabled={loading || !form.date || !form.time || sameDayWarning} className="flex-1 py-3 bg-[#1E2A4A] text-white rounded-lg font-medium hover:bg-[#1E2A4A]/90 disabled:opacity-50">
                {loading ? 'Submitting...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {refCode && <p className="text-center text-sm text-gray-400 mt-6">Referred by code: {refCode}</p>}
      </main>
    </div>
  )
}

export default function NewBookingPage() {
  useEffect(() => { document.title = 'Book a Cleaning | The NYC Maid' }, []);
  return <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}><BookingFormContent /></Suspense>
}
