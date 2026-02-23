import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'

export async function POST(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const body = await request.json()
  const { booking_id, type } = body

  if (!booking_id || !type) {
    return NextResponse.json({ error: 'Missing booking_id or type' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}

  if (type === 'client') {
    updates.payment_status = 'paid'
  } else if (type === 'cleaner') {
    updates.cleaner_paid = true
    updates.cleaner_paid_at = new Date().toISOString()
  }

  const { error } = await supabaseAdmin
    .from('bookings')
    .update(updates)
    .eq('id', booking_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
