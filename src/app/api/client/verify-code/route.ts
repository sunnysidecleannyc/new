import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { notify } from '@/lib/notify'
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
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many attempts. Please wait 10 minutes.' }, { status: 429 })
    }

    const { email, code, phone } = await request.json()

    // Check code
    const { data: verification, error } = await supabaseAdmin
      .from('verification_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .single()

    if (error || !verification) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 401 })
    }

    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Code expired' }, { status: 401 })
    }

    // Delete used code
    await supabaseAdmin.from('verification_codes').delete().eq('email', email.toLowerCase())

    // Get or create client — try phone first (most reliable), then email
    let client = null
    const phoneDigits = phone ? phone.replace(/\D/g, '') : ''

    // Phone match is preferred because admin creates clients with phone
    if (phoneDigits.length >= 10) {
      const { data: allClients } = await supabaseAdmin.from('clients').select('*')
      if (allClients) {
        client = allClients.find(c => {
          const cDigits = (c.phone || '').replace(/\D/g, '')
          return cDigits && (cDigits === phoneDigits || cDigits.endsWith(phoneDigits) || phoneDigits.endsWith(cDigits))
        }) || null
      }
    }

    // Fall back to email if phone didn't match
    if (!client) {
      const { data: emailMatches } = await supabaseAdmin
        .from('clients')
        .select('*')
        .ilike('email', email.trim())
        .order('created_at', { ascending: true })
        .limit(1)
      client = emailMatches?.[0] || null
    }

    // Update the matched client's email if missing or different
    if (client && (!client.email || client.email.toLowerCase() !== email.toLowerCase())) {
      await supabaseAdmin.from('clients').update({ email: email.toLowerCase() }).eq('id', client.id)
    }

    if (!client) {
      // Create new client with email as temporary name
      const { data: newClient, error: createError } = await supabaseAdmin
        .from('clients')
        .insert({
          email: email.toLowerCase(),
          name: email.split('@')[0],
          phone: ''
        })
        .select()
        .single()

      if (createError) {
        console.error('Create client error:', createError)
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      }
      client = newClient

      // Notify admin about new client created via login
      await notify({ type: 'new_client', title: 'New Client (via Login)', message: `${email} • first-time login, auto-created` })
    }

    const response = NextResponse.json({ client, do_not_service: client.do_not_service || false })
    response.cookies.set('client_session', createClientSession(client.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/'
    })
    return response
  } catch (err) {
    console.error('Verify code error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
