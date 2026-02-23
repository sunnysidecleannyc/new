import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'
import { referralCommissionEmail } from '@/lib/email-templates'
import { protectAdminAPI } from '@/lib/auth'

// GET - List commissions (admin only, except for referrer portal)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const referrerId = searchParams.get('referrer_id')
    const status = searchParams.get('status')

    // If requesting by referrer_id, allow (referrer portal uses this)
    // Otherwise require admin auth
    if (!referrerId) {
      const authError = await protectAdminAPI()
      if (authError) return authError
    }

    let query = supabaseAdmin
      .from('referral_commissions')
      .select(`
        *,
        referrers (name, email, ref_code),
        bookings (start_time, price)
      `)
      .order('created_at', { ascending: false })

    if (referrerId) {
      query = query.eq('referrer_id', referrerId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('Commissions GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 })
  }
}

// POST - Create commission (internal use only - called from checkout)
export async function POST(request: Request) {
  // This is called internally from checkout, so we use a different auth check
  // Only allow from internal calls or admin
  const authError = await protectAdminAPI()
  if (authError) return authError

  try {
    const body = await request.json()
    const { booking_id } = body

    if (!booking_id) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
    }

    // Get booking with referrer info
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        clients (name, email)
      `)
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (!booking.referrer_id) {
      return NextResponse.json({ error: 'Booking has no referrer' }, { status: 400 })
    }

    // Check if commission already exists
    const { data: existing } = await supabaseAdmin
      .from('referral_commissions')
      .select('id')
      .eq('booking_id', booking_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Commission already exists for this booking' }, { status: 400 })
    }

    // Calculate commission (10% of final price)
    const grossAmount = booking.price || 0
    const commissionRate = 0.10
    const commissionAmount = Math.round(grossAmount * commissionRate)

    // Create commission record
    const { data: commission, error: commissionError } = await supabaseAdmin
      .from('referral_commissions')
      .insert({
        booking_id,
        referrer_id: booking.referrer_id,
        client_name: booking.clients?.name || 'Unknown',
        gross_amount: grossAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        status: 'pending'
      })
      .select()
      .single()

    if (commissionError) throw commissionError

    // Update referrer's total earned
    const { data: ref } = await supabaseAdmin
      .from('referrers')
      .select('*')
      .eq('id', booking.referrer_id)
      .single()

    if (ref) {
      await supabaseAdmin
        .from('referrers')
        .update({ total_earned: (ref.total_earned || 0) + commissionAmount })
        .eq('id', booking.referrer_id)

      // Send email notification to referrer
      const commissionEmail = referralCommissionEmail(ref, booking, commissionAmount)
      await sendEmail(ref.email, commissionEmail.subject, commissionEmail.html)
    }

    console.log(`Commission created: ${ref?.name} earned $${(commissionAmount / 100).toFixed(2)} from ${booking.clients?.name}'s cleaning`)

    return NextResponse.json({
      commission,
      message: `Commission of $${(commissionAmount / 100).toFixed(2)} created for ${ref?.name}`
    })
  } catch (err) {
    console.error('Commissions POST error:', err)
    return NextResponse.json({ error: 'Failed to create commission' }, { status: 500 })
  }
}

// PUT - Update commission (mark as paid) - admin only
export async function PUT(request: Request) {
  // Protect admin route
  const authError = await protectAdminAPI()
  if (authError) return authError

  try {
    const body = await request.json()
    const { id, status, paid_via } = body

    if (!id) {
      return NextResponse.json({ error: 'Commission ID required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { status }
    
    if (status === 'paid') {
      updates.paid_at = new Date().toISOString()
      updates.paid_via = paid_via || 'zelle'

      // Get commission to update referrer's total_paid
      const { data: commission } = await supabaseAdmin
        .from('referral_commissions')
        .select('referrer_id, commission_amount')
        .eq('id', id)
        .single()

      if (commission) {
        const { data: ref } = await supabaseAdmin
          .from('referrers')
          .select('total_paid')
          .eq('id', commission.referrer_id)
          .single()

        if (ref) {
          await supabaseAdmin
            .from('referrers')
            .update({ total_paid: (ref.total_paid || 0) + commission.commission_amount })
            .eq('id', commission.referrer_id)
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('referral_commissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('Commissions PUT error:', err)
    return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 })
  }
}
