import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'

// GET — list recent unattributed bookings for manual attribution
export async function GET() {
  const authError = await protectAdminAPI()
  if (authError) return authError

  try {
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('id, start_time, created_at, price, status, attributed_domain, clients(name, address, phone)')
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      bookings: (bookings || []).map(b => {
        const client = b.clients as unknown as { name: string; address: string; phone: string } | null
        return {
          id: b.id,
          clientName: client?.name || 'Unknown',
          address: client?.address || '',
          phone: client?.phone || '',
          date: b.start_time || b.created_at,
          price: b.price,
          status: b.status,
          attributed: b.attributed_domain || null,
        }
      })
    })
  } catch (err) {
    console.error('Manual attribution GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

// POST — manually attribute a booking to a domain
export async function POST(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  try {
    const { booking_id, domain } = await request.json()

    if (!booking_id || !domain) {
      return NextResponse.json({ error: 'Missing booking_id or domain' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('bookings')
      .update({
        attributed_domain: domain.replace(/^www\./, ''),
        attribution_confidence: 100,
        attributed_at: new Date().toISOString()
      })
      .eq('id', booking_id)

    if (error) throw error

    // Get client name for notification
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('clients(name)')
      .eq('id', booking_id)
      .single()

    const clientName = (booking?.clients as unknown as { name: string })?.name || 'Unknown'

    await supabaseAdmin.from('notifications').insert({
      type: 'hot_lead',
      title: 'Manual Attribution',
      message: `${clientName} manually attributed to ${domain}`,
      booking_id
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Manual attribution POST error:', err)
    return NextResponse.json({ error: 'Attribution failed' }, { status: 500 })
  }
}
