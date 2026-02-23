import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'
import { verificationCodeEmail } from '@/lib/email-templates'

// Rate limiting: 3 attempts per 10 minutes per email
const rateLimits = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(email: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(email)
  if (!entry || now > entry.resetAt) {
    rateLimits.set(email, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return false
  }
  entry.count++
  return entry.count > 3
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    if (isRateLimited(email.toLowerCase())) {
      return NextResponse.json({ error: 'Too many attempts. Please wait 10 minutes.' }, { status: 429 })
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store code in database
    const { error: dbError } = await supabaseAdmin
      .from('verification_codes')
      .upsert({
        email: email.toLowerCase(),
        code,
        expires_at: expiresAt.toISOString()
      }, { onConflict: 'email' })

    if (dbError) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: 'Failed to store code' }, { status: 500 })
    }

    // Send verification code via email
    const codeEmail = verificationCodeEmail(code)
    const emailResult = await sendEmail(email, codeEmail.subject, codeEmail.html)

    if (!emailResult.success) {
      console.error('Email error:', emailResult.error)
      return NextResponse.json({ error: 'Failed to send code' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Send code error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
