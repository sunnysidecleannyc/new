import { supabaseAdmin } from '@/lib/supabase'
import { sendPushToAll } from '@/lib/push'

interface NotifyOptions {
  type: string
  title: string
  message: string
  booking_id?: string
  url?: string
}

/**
 * Insert a dashboard notification AND send push notification.
 * Use this instead of raw supabase.from('notifications').insert().
 */
export async function notify({ type, title, message, booking_id, url }: NotifyOptions) {
  try {
    await supabaseAdmin.from('notifications').insert({
      type,
      title,
      message,
      booking_id: booking_id || null
    })
  } catch {}

  try {
    await sendPushToAll(title, message, url)
  } catch {}
}
