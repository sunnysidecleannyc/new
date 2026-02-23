import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'
import { sendPushToAll } from '@/lib/push'

export async function GET() {
  // Protect admin route
  const authError = await protectAdminAPI()
  if (authError) return authError

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*, bookings(*, clients(*), cleaners(*))')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  const unread = data?.filter(n => !n.read).length || 0
  
  return NextResponse.json({ notifications: data, unreadCount: unread })
}

export async function POST(request: Request) {
  // Protect admin route
  const authError = await protectAdminAPI()
  if (authError) return authError

  const body = await request.json()
  
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert({
      type: body.type,
      title: body.title,
      message: body.message,
      booking_id: body.booking_id
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send push notification
  try { await sendPushToAll(body.title || 'Notification', body.message || '') } catch {}

  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  // Protect admin route
  const authError = await protectAdminAPI()
  if (authError) return authError

  const body = await request.json()
  
  if (body.markAllRead) {
    await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('read', false)
    return NextResponse.json({ success: true })
  }

  if (body.id) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ read: body.read ?? true })
      .eq('id', body.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Missing id or markAllRead' }, { status: 400 })
}
