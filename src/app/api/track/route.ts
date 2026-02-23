import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function getClientIP(request: Request): string | null {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip')
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(request: Request) {
  try {
    let body: Record<string, any>

    // Handle both JSON and plain text (sendBeacon sends text/plain by default)
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json') || contentType.includes('text/plain')) {
      body = await request.json()
    } else {
      const text = await request.text()
      try { body = JSON.parse(text) } catch {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400, headers: corsHeaders })
      }
    }

    // sendBeacon can only POST — handle PATCH via _method override
    if (body._method === 'PATCH') {
      return handlePatch(request, body)
    }

    const visitorIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''

    const {
      domain, page, action, session_id, visitor_id, lead_id, referrer, ref_code,
      first_domain, first_visit_at, last_domain, device, scroll_depth,
      time_on_page, engaged_30s, placement, scroll_at_cta, time_before_cta,
      cta_clicked_at, load_time_ms, load_speed, utm_source, utm_medium,
      utm_campaign, final_scroll, final_time, cta_clicked,
      screen_w, screen_h, connection, active_time
    } = body

    if (!domain || !action) {
      return NextResponse.json({ error: 'Missing domain or action' }, { status: 400, headers: corsHeaders })
    }

    const payload: Record<string, unknown> = {
        domain,
        page: page || '/',
        action,
        session_id: session_id || null,
        visitor_id: visitor_id || null,
        lead_id: lead_id || null,
        referrer: referrer || null,
        ref_code: ref_code || null,
        first_domain: first_domain || null,
        first_visit_at: first_visit_at || null,
        last_domain: last_domain || null,
        device: device || 'unknown',
        scroll_depth: scroll_depth || 0,
        time_on_page: time_on_page || 0,
        engaged_30s: engaged_30s || false,
        placement: placement || null,
        scroll_at_cta: scroll_at_cta || null,
        time_before_cta: time_before_cta || null,
        cta_clicked_at: cta_clicked_at || null,
        load_time_ms: load_time_ms || null,
        load_speed: load_speed || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        final_scroll: final_scroll || null,
        final_time: final_time || null,
        cta_clicked: cta_clicked || false,
        visitor_ip: visitorIP,
    }

    // New fields — add only if column exists (graceful fallback)
    const extraFields: Record<string, unknown> = {}
    if (visitor_id) extraFields.visitor_id = visitor_id
    if (screen_w) extraFields.screen_w = parseInt(screen_w) || null
    if (screen_h) extraFields.screen_h = parseInt(screen_h) || null
    if (connection) extraFields.connection = connection
    if (active_time) extraFields.active_time = parseInt(active_time) || null
    if (userAgent) extraFields.user_agent = userAgent.substring(0, 500)

    // Try insert with all fields first
    let fullPayload = { ...payload, ...extraFields }
    let { error } = await supabaseAdmin.from('lead_clicks').insert(fullPayload)

    // If insert fails (new columns don't exist yet), retry without extra fields
    if (error) {
      console.error('Track insert error (retrying without new fields):', error.message, 'Domain:', domain)
      const { error: err2 } = await supabaseAdmin.from('lead_clicks').insert(payload)
      if (err2) {
        // Final retry without visitor_ip
        delete payload.visitor_ip
        const retry = await supabaseAdmin.from('lead_clicks').insert(payload)
        error = retry.error
        if (error) {
          console.error('Track insert retry failed:', error.message, 'Domain:', domain)
        }
      } else {
        error = null
      }
    }

    // Notify on high-intent actions
    if (!error && (action === 'book' || action === 'call' || action === 'text' || action === 'pay')) {
      const actionLabels: Record<string, string> = {
        book: '🔥 Book click',
        call: '📞 Call click',
        text: '💬 Text click',
        pay: '💳 Pay click'
      }
      const deviceLabel = device === 'mobile' ? ' (📱 mobile)' : device === 'tablet' ? ' (📱 tablet)' : ''
      await supabaseAdmin.from('notifications').insert({
        type: 'hot_lead',
        title: 'Hot Lead',
        message: (actionLabels[action] || action) + ' from ' + domain + deviceLabel
      })
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (err) {
    console.error('Track error:', err)
    return NextResponse.json({ success: true }, { headers: corsHeaders })
  }
}

// Shared PATCH logic (called from PATCH endpoint and sendBeacon _method override)
async function handlePatch(request: Request, body?: Record<string, unknown>) {
  try {
    if (!body) {
      const text = await request.text()
      body = JSON.parse(text)
    }
    const { session_id, visitor_id, domain, final_scroll, final_time, cta_clicked, active_time } = body as Record<string, any>

    if (!session_id || !domain) {
      return NextResponse.json({ error: 'Missing session_id or domain' }, { status: 400, headers: corsHeaders })
    }

    // Try both www and non-www variants (old visits may have www., new ones don't)
    const domainVariants = [domain]
    if (domain.startsWith('www.')) {
      domainVariants.push(domain.replace('www.', ''))
    } else {
      domainVariants.push(`www.${domain}`)
    }
    const { data: visits } = await supabaseAdmin
      .from('lead_clicks')
      .select('id')
      .eq('session_id', session_id)
      .in('domain', domainVariants)
      .eq('action', 'visit')
      .order('created_at', { ascending: false })
      .limit(1)

    if (visits && visits.length > 0) {
      const update: Record<string, unknown> = {
        final_scroll: final_scroll || 0,
        final_time: final_time || 0,
        cta_clicked: cta_clicked || false,
        engaged_30s: (final_time || 0) >= 30
      }
      if (active_time) update.active_time = parseInt(active_time) || null
      if (visitor_id) update.visitor_id = visitor_id

      await supabaseAdmin
        .from('lead_clicks')
        .update(update)
        .eq('id', visits[0].id)
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (err) {
    console.error('Track PATCH error:', err)
    return NextResponse.json({ success: true }, { headers: corsHeaders })
  }
}

// PATCH - Update visit with final scroll/time on page leave
export async function PATCH(request: Request) {
  return handlePatch(request)
}

// GET - Pixel fallback for when sendBeacon and fetch both fail
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const body: Record<string, string | null> = {}
  searchParams.forEach((value, key) => { body[key] = value })

  const fakeRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(body)
  })

  return POST(fakeRequest)
}
