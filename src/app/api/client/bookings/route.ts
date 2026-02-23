import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectClientAPI, isAdminAuthenticated } from '@/lib/auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')

  if (!clientId) {
    return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })
  }

  // Allow admin or authenticated client (matching client_id)
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) {
    const auth = await protectClientAPI(clientId)
    if (auth instanceof NextResponse) return auth
  }

  const now = new Date().toISOString()

  // Get the client record to find email/phone for fallback matching
  const { data: clientRecord } = await supabaseAdmin
    .from('clients')
    .select('email, phone, do_not_service')
    .eq('id', clientId)
    .single()

  // Collect all client IDs that belong to this person (handles duplicates)
  const clientIds = [clientId]

  if (clientRecord?.email) {
    const { data: emailMatches } = await supabaseAdmin
      .from('clients')
      .select('id')
      .ilike('email', clientRecord.email.trim())
    if (emailMatches) {
      for (const m of emailMatches) {
        if (!clientIds.includes(m.id)) clientIds.push(m.id)
      }
    }
  }

  if (clientRecord?.phone) {
    const digits = clientRecord.phone.replace(/\D/g, '')
    if (digits.length >= 10) {
      const { data: allClients } = await supabaseAdmin.from('clients').select('id, phone')
      if (allClients) {
        for (const c of allClients) {
          const cDigits = (c.phone || '').replace(/\D/g, '')
          if (cDigits && (cDigits === digits || cDigits.endsWith(digits) || digits.endsWith(cDigits))) {
            if (!clientIds.includes(c.id)) clientIds.push(c.id)
          }
        }
      }
    }
  }

  // Upcoming bookings (across all matching client IDs)
  const { data: upcoming } = await supabaseAdmin
    .from('bookings')
    .select('*, cleaners(name)')
    .in('client_id', clientIds)
    .gte('start_time', now)
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true })

  // Past bookings
  const { data: past } = await supabaseAdmin
    .from('bookings')
    .select('*, cleaners(name)')
    .in('client_id', clientIds)
    .lt('start_time', now)
    .order('start_time', { ascending: false })
    .limit(20)

  return NextResponse.json({ upcoming: upcoming || [], past: past || [], do_not_service: clientRecord?.do_not_service || false })
}
