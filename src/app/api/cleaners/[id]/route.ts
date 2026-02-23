import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Protect admin route
  const authError = await protectAdminAPI()
  if (authError) return authError

  const { id } = await params
  const body = await request.json()

  // Strip past dates from unavailable_dates
  const today = new Date().toISOString().split('T')[0]
  const futureDates = (body.unavailable_dates || []).filter((d: string) => d >= today)

  const { data, error } = await supabaseAdmin
    .from('cleaners')
    .update({
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      address: body.address ?? undefined,
      photo_url: body.photo_url || null,
      working_days: body.working_days || [],
      schedule: body.schedule ?? undefined,
      working_start: body.working_start || '09:00',
      working_end: body.working_end || '17:00',
      unavailable_dates: futureDates,
      pin: body.pin ?? undefined,
      hourly_rate: body.hourly_rate ?? undefined,
      active: body.active ?? undefined
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Protect admin route
  const authError = await protectAdminAPI()
  if (authError) return authError

  const { id } = await params
  
  // Soft delete - set active to false
  const { error } = await supabaseAdmin
    .from('cleaners')
    .update({ active: false })
    .eq('id', id)
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, archived: true })
}
