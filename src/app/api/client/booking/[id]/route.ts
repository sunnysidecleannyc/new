import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectClientAPI, isAdminAuthenticated } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*, cleaners(name)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  // Allow admin or authenticated client who owns this booking
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) {
    const auth = await protectClientAPI(data.client_id)
    if (auth instanceof NextResponse) return auth
  }

  return NextResponse.json(data)
}
