import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cleanerId = searchParams.get('cleaner_id')

  if (!cleanerId) {
    return NextResponse.json({ error: 'Missing cleaner_id' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('cleaners')
    .select('working_days, schedule, unavailable_dates, photo_url')
    .eq('id', cleanerId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Cleaner not found' }, { status: 404 })
  }

  return NextResponse.json({
    working_days: data.working_days || [],
    schedule: data.schedule || {},
    unavailable_dates: data.unavailable_dates || [],
    photo_url: data.photo_url || null
  })
}

export async function PUT(request: Request) {
  const body = await request.json()
  const { cleaner_id, working_days, schedule, unavailable_dates } = body

  if (!cleaner_id) {
    return NextResponse.json({ error: 'Missing cleaner_id' }, { status: 400 })
  }

  // Strip past dates from unavailable_dates
  const today = new Date().toISOString().split('T')[0]
  const futureDates = (unavailable_dates || []).filter((d: string) => d >= today)

  const { data, error } = await supabaseAdmin
    .from('cleaners')
    .update({
      working_days: working_days || [],
      schedule: schedule || {},
      unavailable_dates: futureDates
    })
    .eq('id', cleaner_id)
    .select('name')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify admin via email (fire and forget)
  fetch(new URL('/api/send-booking-emails', request.url).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'admin-notification',
      subject: `${data?.name || 'A cleaner'} updated their availability`,
      message: `Working days: ${(working_days || []).join(', ') || 'None'}\nDays off: ${futureDates.length > 0 ? futureDates.join(', ') : 'None'}`
    })
  }).catch(() => {})

  return NextResponse.json({ success: true })
}
