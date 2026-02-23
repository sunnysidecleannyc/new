import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await protectAdminAPI()
  if (authError) return authError
  
  const { id } = await params
  const { data, error } = await supabaseAdmin.from('clients').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

const ALLOWED_CLIENT_FIELDS = ['name', 'email', 'phone', 'address', 'unit', 'notes', 'active', 'referrer_id', 'do_not_service', 'pin']

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()

    // Only allow known fields
    const update: Record<string, any> = {}
    for (const key of Object.keys(body)) {
      if (ALLOWED_CLIENT_FIELDS.includes(key)) {
        update[key] = body[key]
      }
    }

    // Never overwrite address with empty string — addresses are critical for service
    if ('address' in update && (!update.address || !update.address.trim())) {
      delete update.address
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.from('clients').update(update).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    console.error('Client update error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const { id } = await params

  // Soft delete - set active to false (keeps booking history intact)
  const { error } = await supabaseAdmin.from('clients').update({ active: false }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, archived: true })
}
