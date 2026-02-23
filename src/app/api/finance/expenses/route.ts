import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'

export async function GET() {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const { data, error } = await supabaseAdmin
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const body = await request.json()

  const { data, error } = await supabaseAdmin
    .from('expenses')
    .insert({
      date: body.date,
      amount: body.amount,
      category: body.category,
      description: body.description,
      vendor: body.vendor || null,
      receipt_url: body.receipt_url || null
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  // Get expense to find receipt path
  const { data: expense } = await supabaseAdmin
    .from('expenses')
    .select('receipt_url')
    .eq('id', id)
    .single()

  // Delete receipt from storage if exists
  if (expense?.receipt_url) {
    const path = expense.receipt_url.split('/finance/')[1]
    if (path) {
      await supabaseAdmin.storage.from('finance').remove([path])
    }
  }

  const { error } = await supabaseAdmin
    .from('expenses')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
