import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'

export async function POST(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const { clients } = await request.json()
  
  let success = 0, failed = 0, skipped = 0
  
  for (const client of clients) {
    const digits = (client.phone || '').replace(/\D/g, '')
    const pin = digits.length >= 4 ? digits.slice(-4) : '0000'
    
    const { error } = await supabaseAdmin.from('clients').insert({
      name: client.name,
      phone: client.phone || null,
      email: client.email || null,
      address: client.address || null,
      notes: client.notes || null,
      pin: pin,
      active: true
    })
    
    if (error) {
      error.message.includes('duplicate') ? skipped++ : failed++
    } else {
      success++
    }
  }
  
  return NextResponse.json({ success, failed, skipped })
}
