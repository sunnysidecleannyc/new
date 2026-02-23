import { NextResponse } from 'next/server'
import { protectAdminAPI } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { DEFAULT_SETTINGS, clearSettingsCache } from '@/lib/settings'

// Fields allowed for update (whitelist)
const ALLOWED_FIELDS = new Set([
  'business_name',
  'business_phone',
  'business_email',
  'business_website',
  'admin_email',
  'email_from_name',
  'email_from_address',
  'service_types',
  'standard_rate',
  'budget_rate',
  'payment_methods',
  'business_hours_start',
  'business_hours_end',
  'booking_buffer_minutes',
  'default_duration_hours',
  'min_days_ahead',
  'allow_same_day',
  'commission_rate',
  'attribution_window_hours',
  'active_client_threshold_days',
  'at_risk_threshold_days',
  'reschedule_notice_recurring_days',
  'reschedule_notice_onetime_hours',
  'reminder_days',
  'reminder_hours_before',
  'daily_summary_enabled',
])

export async function GET() {
  const authError = await protectAdminAPI()
  if (authError) return authError

  // Try to load existing settings
  const { data, error } = await supabaseAdmin
    .from('settings')
    .select('*')
    .limit(1)
    .single()

  if (data) {
    return NextResponse.json(data)
  }

  // No row exists — create default row
  if (error?.code === 'PGRST116' || !data) {
    const { data: newRow, error: insertError } = await supabaseAdmin
      .from('settings')
      .insert({ ...DEFAULT_SETTINGS })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create default settings', details: insertError.message }, { status: 500 })
    }

    return NextResponse.json(newRow)
  }

  return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
}

export async function PUT(request: Request) {
  const authError = await protectAdminAPI()
  if (authError) return authError

  const body = await request.json()

  // Filter to only allowed fields
  const updates: Record<string, unknown> = {}
  for (const key of Object.keys(body)) {
    if (ALLOWED_FIELDS.has(key)) {
      updates[key] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  // Get the settings row id first
  const { data: existing } = await supabaseAdmin
    .from('settings')
    .select('id')
    .limit(1)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Settings not initialized. Call GET first.' }, { status: 404 })
  }

  const { data, error } = await supabaseAdmin
    .from('settings')
    .update(updates)
    .eq('id', existing.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update settings', details: error.message }, { status: 500 })
  }

  clearSettingsCache()

  return NextResponse.json(data)
}
