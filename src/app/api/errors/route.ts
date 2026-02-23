import { NextResponse } from 'next/server'
import { trackError } from '@/lib/error-tracking'

// Known transient/harmless errors that don't need email alerts
const IGNORABLE_PATTERNS = [
  'Script error',           // CORS / deployment cache miss
  'ChunkLoadError',         // Next.js deployment chunk miss
  'Loading chunk',          // Webpack chunk loading failure
  'Failed to fetch',        // Transient network
  'Load failed',            // Transient network (Safari)
  'NetworkError',           // Network connectivity
  'ResizeObserver loop',    // Browser rendering artifact
  'AbortError',             // User navigated away
  'cancelled',              // Request cancelled
  'TypeError: cancelled',   // Safari fetch abort
  '_leaflet_pos',           // Leaflet map render race condition
  'Minified React error',   // React hydration mismatches (#418 etc)
  'Hydration failed',       // React hydration mismatch
  'Text content does not match', // React hydration text mismatch
]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, stack, url, source } = body

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const isTransient = IGNORABLE_PATTERNS.some(p => message.includes(p))

    if (isTransient) {
      console.log(`[TRANSIENT] ${source}: ${message.slice(0, 100)}`)
      return NextResponse.json({ success: true })
    }

    const error = new Error(message)
    if (stack) error.stack = stack

    await trackError(error, {
      source: source || 'client',
      severity: 'high',
      url
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error reporting endpoint failed:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
