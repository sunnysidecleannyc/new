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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect old /login to /admin
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Protect admin sub-routes — redirect to /admin if not authenticated
  // /admin itself is allowed through (it handles its own auth check)
  if (pathname.startsWith('/admin/')) {
    const session = request.cookies.get('admin_session')?.value
    const secret = process.env.ADMIN_PASSWORD || ''

    if (!session || !await verifySession(session, secret)) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://js.stripe.com https://unpkg.com https://embed.tawk.to https://*.tawk.to",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://*.tawk.to",
      "font-src 'self' https://fonts.gstatic.com https://*.tawk.to",
      "img-src 'self' data: blob: https://*.supabase.co https://maps.googleapis.com https://maps.gstatic.com https://*.tile.openstreetmap.org https://tawk.to https://*.tawk.to",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com https://api.radar.io https://api.telnyx.com wss://*.tawk.to https://*.tawk.to",
      "frame-src 'self' https://js.stripe.com https://tawk.to https://*.tawk.to",
      "frame-ancestors 'none'",
    ].join('; ')
  )

  return response
}

export const config = {
  matcher: [
    // Match all paths except static files and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
