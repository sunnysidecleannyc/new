'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

function ClientPortalContent() {
  const [step, setStep] = useState<'login' | 'pin'>('login')
  const [phone, setPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientName, setClientName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    document.title = 'Client Portal | The NYC Maid'
    const ref = searchParams.get('ref')
    if (ref) {
      router.replace('/book/new?ref=' + ref)
    }
  }, [searchParams, router])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/client/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: phone })
    })

    if (res.ok) {
      const data = await res.json()
      if (data.exists) {
        setClientEmail(data.email || '')
        setClientName(data.name || '')

        if (data.email) {
          const codeRes = await fetch('/api/client/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: data.email })
          })
          if (!codeRes.ok) {
            setError('Failed to send verification code. Please try again.')
            setLoading(false)
            return
          }
        }
        setStep('pin')
      } else {
        setError('No account found with this phone number. Call (212) 202-8400 to book.')
      }
    } else {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/client/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: clientEmail, code: pin, phone })
    })

    if (res.ok) {
      const data = await res.json()
      localStorage.setItem('client_id', data.client.id)
      localStorage.setItem('client_name', data.client.name || clientName || 'Client')
      if (data.do_not_service) {
        localStorage.setItem('client_dns', 'true')
      } else {
        localStorage.removeItem('client_dns')
      }
      router.push('/book/dashboard')
    } else {
      const data = await res.json().catch(() => ({}))
      setError(
        data.error === 'Code expired'
          ? 'Code expired. Please try again.'
          : 'Invalid code. Please try again.'
      )
    }
    setLoading(false)
  }

  const ref = searchParams.get('ref')
  if (ref) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#1E2A4A]">Client Portal</h1>
          <p className="text-gray-500 mt-1">View and manage your bookings</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        {step === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="w-full px-4 py-3 border rounded-lg text-[#1E2A4A] text-lg"
                placeholder="(212) 555-1234"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || phone.replace(/\D/g, '').length < 10}
              className="w-full py-3 bg-[#1E2A4A] text-white rounded-lg font-medium hover:bg-[#1E2A4A]/90 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            {clientEmail ? (
              <p className="text-sm text-gray-600 text-center mb-4">
                We sent a 6-digit code to your email on file. Check your spam folder if you don&apos;t see it.
              </p>
            ) : (
              <p className="text-sm text-gray-600 text-center mb-4">
                No email on file. Call <a href="tel:2122028400" className="text-[#1E2A4A] font-medium">(212) 202-8400</a> to add your email and enable login.
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border rounded-lg text-[#1E2A4A] text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || pin.length < 6}
              className="w-full py-3 bg-[#1E2A4A] text-white rounded-lg font-medium hover:bg-[#1E2A4A]/90 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Login'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('login'); setPin(''); setError('') }}
              className="w-full py-2 text-gray-500 text-sm hover:text-[#1E2A4A]"
            >
              ← Back
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-sm text-gray-500">
            New client?{' '}
            <a href="/book/new" className="text-[#1E2A4A] hover:underline">Book your first cleaning</a>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">Questions? Call (212) 202-8400</p>
        </div>
      </div>
    </div>
  )
}

export default function ClientPortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <ClientPortalContent />
    </Suspense>
  )
}
