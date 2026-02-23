import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('client_sms_messages')
    .select('id, direction, message, created_at')
    .eq('client_id', id)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) {
    console.error('Transcript fetch error:', error)
    return NextResponse.json([])
  }

  // If no client_sms_messages, check sms_conversation_messages (for legacy potential clients)
  if (!data || data.length === 0) {
    const { data: convo } = await supabaseAdmin
      .from('sms_conversations')
      .select('id')
      .eq('client_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (convo) {
      const { data: convoMessages } = await supabaseAdmin
        .from('sms_conversation_messages')
        .select('id, direction, message, created_at')
        .eq('conversation_id', convo.id)
        .order('created_at', { ascending: true })
        .limit(200)

      return NextResponse.json(convoMessages || [])
    }
  }

  return NextResponse.json(data || [])
}
