import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'

// GET - fetch all notes
export async function GET() {
  const authError = await protectAdminAPI()
  if (authError) return authError

  try {
    const { data, error } = await supabaseAdmin
      .from('domain_notes')
      .select('*')

    if (error) throw error

    // Convert to object keyed by domain
    const notes: Record<string, string> = {}
    data?.forEach(row => {
      notes[row.domain] = row.notes || ''
    })

    return NextResponse.json({ notes })
  } catch (err) {
    console.error('Failed to fetch notes:', err)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

// POST - save note for a domain
export async function POST(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  try {
    const { domain, notes } = await request.json()

    if (!domain) {
      return NextResponse.json({ error: 'Domain required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('domain_notes')
      .upsert({
        domain,
        notes: notes || '',
        updated_at: new Date().toISOString()
      }, { onConflict: 'domain' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to save note:', err)
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }
}
