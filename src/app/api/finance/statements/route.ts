import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'

export async function GET() {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const { data, error } = await supabaseAdmin
    .from('bank_statements')
    .select('*')
    .order('month', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const body = await request.json()
  const { month, account_name, file_url, notes } = body

  const { data, error } = await supabaseAdmin
    .from('bank_statements')
    .insert({ month, account_name, file_url, notes })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

  // Get the statement to find file path
  const { data: statement } = await supabaseAdmin
    .from('bank_statements')
    .select('file_url')
    .eq('id', id)
    .single()

  // Delete from storage if file exists
  if (statement?.file_url) {
    const path = statement.file_url.split('/finance/')[1]
    if (path) {
      await supabaseAdmin.storage.from('finance').remove([path])
    }
  }

  const { error } = await supabaseAdmin
    .from('bank_statements')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
