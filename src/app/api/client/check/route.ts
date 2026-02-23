import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Rate limiting: 10 lookups per 10 minutes per IP
const rateLimits = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return false
  }
  entry.count++
  return entry.count > 10
}

async function findClient(input: string) {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Try email first (case-insensitive)
  const { data: byEmail } = await supabaseAdmin
    .from('clients')
    .select('id, phone, email, name')
    .ilike('email', trimmed)
    .maybeSingle()

  if (byEmail) return byEmail

  // Try phone — strip to digits and search
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length >= 7) {
    // Try exact digits match
    const { data: clients } = await supabaseAdmin
      .from('clients')
      .select('id, phone, email, name')

    if (clients) {
      const match = clients.find(c => {
        const cDigits = (c.phone || '').replace(/\D/g, '')
        return cDigits === digits || cDigits.endsWith(digits) || digits.endsWith(cDigits)
      })
      if (match) return match
    }
  }

  return null
}

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const input = searchParams.get('email') || searchParams.get('input') || ''
  const client = await findClient(input)
  return NextResponse.json({
    exists: !!client,
    phone: client?.phone || null,
    email: client?.email || null,
    name: client?.name || null
  })
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const body = await request.json()
  const input = body.email || body.input || ''
  const client = await findClient(input)
  return NextResponse.json({
    exists: !!client,
    phone: client?.phone || null,
    email: client?.email || null,
    name: client?.name || null
  })
}
