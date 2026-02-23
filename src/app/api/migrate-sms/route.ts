import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'

export async function POST() {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const results: string[] = []

  try {
    // 1. Create sms_logs table
    const { error: e1 } = await supabaseAdmin.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS sms_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
        sms_type TEXT NOT NULL,
        recipient TEXT NOT NULL,
        telnyx_message_id TEXT,
        status TEXT DEFAULT 'sent',
        created_at TIMESTAMPTZ DEFAULT now()
      )`
    })
    if (e1) {
      // Try creating via raw inserts approach - table might need manual creation
      results.push('sms_logs table: ' + (e1.message || 'RPC not available'))
    } else {
      results.push('sms_logs table: created')
    }

    // 2. Add sms_consent to clients
    const { error: e2 } = await supabaseAdmin.rpc('exec_sql', {
      sql: `ALTER TABLE clients ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN DEFAULT true`
    })
    if (e2) {
      results.push('clients.sms_consent: ' + (e2.message || 'RPC not available'))
    } else {
      results.push('clients.sms_consent: added')
    }

    // 3. Add sms_consent to cleaners
    const { error: e3 } = await supabaseAdmin.rpc('exec_sql', {
      sql: `ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN DEFAULT true`
    })
    if (e3) {
      results.push('cleaners.sms_consent: ' + (e3.message || 'RPC not available'))
    } else {
      results.push('cleaners.sms_consent: added')
    }

    return NextResponse.json({ results, note: 'If RPC failed, run the SQL in create-sms-tables.sql via the Supabase dashboard SQL editor' })
  } catch (err) {
    return NextResponse.json({ error: String(err), results }, { status: 500 })
  }
}
