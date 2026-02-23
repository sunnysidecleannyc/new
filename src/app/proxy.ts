import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

async function verifySession(cookie: string, secret: string): Promise<boolean> {
  if (!cookie || !cookie.includes('.')) return false
  const [token, signature] = cookie.split('.')
  if (!token || !signature) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(token))
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return expected === signature
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const session = request.cookies.get('admin_session')?.value
    const secret = process.env.ADMIN_PASSWORD || ''

    if (!session || !await verifySession(session, secret)) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
