import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'

export async function PUT(request: Request) {
  // Protect admin route
  const authError = await protectAdminAPI()
  if (authError) return authError

  const body = await request.json()
  const { priorities } = body as { priorities: { id: string; priority: number }[] }

  if (!priorities || !Array.isArray(priorities)) {
    return NextResponse.json({ error: 'Invalid priorities array' }, { status: 400 })
  }

  // Update each cleaner's priority
  for (const { id, priority } of priorities) {
    const { error } = await supabaseAdmin
      .from('cleaners')
      .update({ priority })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
