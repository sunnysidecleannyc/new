import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'

export async function GET() {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('type', 'feedback')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    feedback: data,
    totalCount: data?.length || 0,
    unreadCount: data?.filter(d => !d.read).length || 0
  })
}

export async function PUT(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const { id, read } = await request.json()

  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ read })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const { id } = await request.json()

  const { error } = await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
