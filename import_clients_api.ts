// Add this file to: src/app/api/import-clients/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { clients, password } = await request.json()
  
  // Simple auth
  if (password !== 'NycMaid2024!') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  let success = 0
  let failed = 0
  let skipped = 0
  const errors: string[] = []
  
  for (const client of clients) {
    const digits = (client.phone || '').replace(/\D/g, '')
    const pin = digits.length >= 4 ? digits.slice(-4) : String(1000 + Math.abs(client.name.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0) % 9000))
    
    const { error } = await supabase
      .from('clients')
      .insert({
        name: client.name,
        phone: client.phone || null,
        email: client.email || null,
        address: client.address || null,
        notes: client.notes || null,
        pin: pin,
        active: true
      })
    
    if (error) {
      if (error.message.includes('duplicate')) {
        skipped++
      } else {
        failed++
        errors.push(`${client.name}: ${error.message}`)
      }
    } else {
      success++
    }
  }
  
  return NextResponse.json({ success, failed, skipped, errors: errors.slice(0, 10) })
}
