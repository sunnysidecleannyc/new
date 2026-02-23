import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const { pin } = await request.json()

  if (!pin || pin.length < 4 || pin.length > 6) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 400 })
  }

  const { data: cleaner, error } = await supabaseAdmin
    .from('cleaners')
    .select('id, name, email, active, pin')
    .eq('pin', pin)
    .eq('active', true)
    .single()

  if (error || !cleaner) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const { pin: _, ...safeCleanerData } = cleaner

  return NextResponse.json({ cleaner: safeCleanerData })
}
