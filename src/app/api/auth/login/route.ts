import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSessionCookie } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { notify } from '@/lib/notify'

// In-memory rate limiting
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const ua = request.headers.get('user-agent') || 'unknown'

    // Check rate limiting
    const now = Date.now()
    const attempts = loginAttempts.get(ip)

    if (attempts) {
      if (now - attempts.lastAttempt > 5 * 60 * 1000) {
        loginAttempts.delete(ip)
      } else if (attempts.count >= 5) {
        await notify({ type: 'security', title: 'Login Locked', message: `IP ${ip} locked out after 5 failed attempts` })
        return NextResponse.json({ error: 'Too many attempts. Try again in 5 minutes.' }, { status: 429 })
      }
    }

    const adminPassword = process.env.ADMIN_PASSWORD

    if (password === adminPassword) {
      loginAttempts.delete(ip)

      // Set signed session cookie
      const session = createSessionCookie()
      const cookieStore = await cookies()
      cookieStore.set('admin_session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
      })

      // Log successful login + notify
      const timeET = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
      await notify({ type: 'security', title: 'Admin Login', message: `Login from ${ip} at ${timeET}` })

      // Email alert
      if (process.env.ADMIN_EMAIL) {
        const html = `
          <div style="font-family: sans-serif; max-width: 400px;">
            <h3 style="color: #000;">Admin Login Alert</h3>
            <p><strong>IP:</strong> ${ip}</p>
            <p><strong>Time:</strong> ${timeET}</p>
            <p><strong>Device:</strong> ${ua.substring(0, 100)}</p>
            <p style="color: #666; font-size: 12px;">If this wasn't you, change ADMIN_PASSWORD immediately.</p>
          </div>
        `
        try { await sendEmail(process.env.ADMIN_EMAIL, 'Admin Login Alert', html) } catch {}
      }

      return NextResponse.json({ success: true })
    }

    // Track failed attempt
    const currentAttempts = loginAttempts.get(ip) || { count: 0, lastAttempt: now }
    const newCount = currentAttempts.count + 1
    loginAttempts.set(ip, { count: newCount, lastAttempt: now })

    // Log failed attempts (3+ only to avoid noise)
    if (newCount >= 3) {
      await notify({ type: 'security', title: 'Failed Login', message: `${newCount} failed login attempts from ${ip}` })
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
