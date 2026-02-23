import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectAdminAPI } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { subscription, role, cleaner_id, client_id } = await request.json()

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    const effectiveRole = role || 'admin'

    // Admin requests still need admin auth
    if (effectiveRole === 'admin') {
      const authError = await protectAdminAPI()
      if (authError) return authError
    }

    // Validate cleaner/client IDs match role
    if (effectiveRole === 'cleaner' && !cleaner_id) {
      return NextResponse.json({ error: 'Missing cleaner_id' }, { status: 400 })
    }
    if (effectiveRole === 'client' && !client_id) {
      return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })
    }

    // Check if this endpoint already exists
    const { data: existing } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .limit(1)

    if (existing && existing.length > 0) {
      // Update existing subscription (keys or role may have changed)
      await supabaseAdmin
        .from('push_subscriptions')
        .update({
          subscription,
          role: effectiveRole,
          cleaner_id: effectiveRole === 'cleaner' ? cleaner_id : null,
          client_id: effectiveRole === 'client' ? client_id : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing[0].id)
    } else {
      await supabaseAdmin
        .from('push_subscriptions')
        .insert({
          endpoint: subscription.endpoint,
          subscription,
          role: effectiveRole,
          cleaner_id: effectiveRole === 'cleaner' ? cleaner_id : null,
          client_id: effectiveRole === 'client' ? client_id : null
        })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Push subscribe error:', err)
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { endpoint } = await request.json()

    if (endpoint) {
      await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', endpoint)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Push unsubscribe error:', err)
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 })
  }
}
