import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'
import { attributeByAddress, extractZip, getNeighborhood, getDomainsForNeighborhood } from '@/lib/attribution'

// POST - Run attribution for all unattributed bookings
// Pass ?reset=true to clear all existing attributions and re-run
export async function POST(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const reset = searchParams.get('reset') === 'true'

    // Clear existing attributions if reset requested
    if (reset) {
      await supabaseAdmin
        .from('bookings')
        .update({ attributed_domain: null, attribution_confidence: null, attributed_at: null })
        .not('attributed_domain', 'is', null)
    }

    // Get all bookings without attribution, with client address
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, client_id, start_time, created_at, clients(address, name)')
      .is('attributed_domain', null)
      .order('created_at', { ascending: false })

    if (bookingsError) throw bookingsError

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ message: 'No unattributed bookings', attributed: 0, total: 0 })
    }

    let attributedCount = 0
    const usedClickIds: string[] = []
    const results: Array<{ booking_id: string; domain: string | null; confidence: number; neighborhood?: string }> = []

    for (const booking of bookings) {
      const client = booking.clients as unknown as { address: string; name: string } | null
      if (!client?.address) {
        results.push({ booking_id: booking.id, domain: null, confidence: 0 })
        continue
      }

      // Use the booking's created_at or start_time as the reference point
      const referenceTime = booking.created_at || booking.start_time

      // Each CTA can only be used once — pass already-used click IDs to exclude
      const result = await attributeByAddress(client.address, referenceTime, usedClickIds)

      if (result) {
        usedClickIds.push(result.clickId)

        // Update booking with attribution
        await supabaseAdmin
          .from('bookings')
          .update({
            attributed_domain: result.domain,
            attribution_confidence: result.confidence,
            attributed_at: new Date().toISOString()
          })
          .eq('id', booking.id)

        attributedCount++
        results.push({
          booking_id: booking.id,
          domain: result.domain,
          confidence: result.confidence,
          neighborhood: result.neighborhood
        })
      } else {
        results.push({ booking_id: booking.id, domain: null, confidence: 0 })
      }
    }

    return NextResponse.json({
      message: `Attributed ${attributedCount} of ${bookings.length} bookings`,
      attributed: attributedCount,
      total: bookings.length,
      results: results.filter(r => r.domain) // only show successful attributions
    })
  } catch (err) {
    console.error('Attribution error:', err)
    return NextResponse.json({ error: 'Attribution failed' }, { status: 500 })
  }
}

// GET - Debug attribution for a specific booking, or get stats
export async function GET(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('booking_id')

    if (bookingId) {
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('id, client_id, start_time, created_at, price, clients(address, name)')
        .eq('id', bookingId)
        .single()

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      const client = booking.clients as unknown as { address: string; name: string } | null
      if (!client?.address) {
        return NextResponse.json({ error: 'No address for client' }, { status: 400 })
      }

      const zip = extractZip(client.address)
      const neighborhood = zip ? getNeighborhood(zip) : null
      const possibleDomains = neighborhood ? getDomainsForNeighborhood(neighborhood) : []

      // Also check for matching activity
      const result = await attributeByAddress(client.address, booking.created_at || booking.start_time)

      return NextResponse.json({
        booking_id: bookingId,
        client_name: client.name,
        address: client.address,
        zip,
        neighborhood,
        possible_domains: possibleDomains,
        match: result
      })
    }

    // Get attribution stats by domain
    const { data: attributedBookings } = await supabaseAdmin
      .from('bookings')
      .select('attributed_domain, attribution_confidence, price, status')
      .not('attributed_domain', 'is', null)

    const stats: Record<string, {
      bookings: number
      revenue: number
      avgConfidence: number
      completedBookings: number
      completedRevenue: number
    }> = {}

    attributedBookings?.forEach(b => {
      const domain = b.attributed_domain
      if (!stats[domain]) {
        stats[domain] = {
          bookings: 0, revenue: 0, avgConfidence: 0,
          completedBookings: 0, completedRevenue: 0
        }
      }
      stats[domain].bookings++
      stats[domain].revenue += b.price || 0
      stats[domain].avgConfidence += b.attribution_confidence || 0

      if (b.status === 'completed') {
        stats[domain].completedBookings++
        stats[domain].completedRevenue += b.price || 0
      }
    })

    Object.keys(stats).forEach(domain => {
      if (stats[domain].bookings > 0) {
        stats[domain].avgConfidence = Math.round(stats[domain].avgConfidence / stats[domain].bookings)
      }
    })

    return NextResponse.json({ stats })
  } catch (err) {
    console.error('Attribution GET error:', err)
    return NextResponse.json({ error: 'Failed to get attribution stats' }, { status: 500 })
  }
}
