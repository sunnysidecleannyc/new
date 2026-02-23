import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createClientSession } from '@/lib/auth'

// Rate limiting: 5 attempts per 10 minutes per IP
const rateLimits = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return false
  }
  entry.count++
  return entry.count > 5
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const { email, pin } = await request.json()
  const { data: client } = await supabaseAdmin.from('clients').select('*').eq('email', email).single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  const storedPin = client.pin
  const phonePin = client.phone?.replace(/\D/g, '').slice(-4)
  if (pin === storedPin || pin === phonePin) {
    const response = NextResponse.json({ success: true, client })
    response.cookies.set('client_session', createClientSession(client.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/'
    })
    return response
  }
  return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
}
