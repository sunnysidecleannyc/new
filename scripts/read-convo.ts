import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf8')

const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL="([^"]+)"/)
const url = urlMatch![1]

// Parse multi-line service role key
const keyStart = envContent.indexOf('SUPABASE_SERVICE_ROLE_KEY="') + 'SUPABASE_SERVICE_ROLE_KEY="'.length
const keyEnd = envContent.indexOf('"', keyStart)
const key = envContent.substring(keyStart, keyEnd).replace(/\\n/g, '').replace(/\s+/g, '')

const sb = createClient(url, key)

async function main() {
  const { data: convos, error } = await sb.from('sms_conversations').select('*').order('updated_at', { ascending: false }).limit(3)
  if (error) { console.log('Error:', error); return }
  if (!convos || convos.length === 0) { console.log('No convos'); return }

  for (const convo of convos) {
    console.log('\n=== Phone:', convo.phone, '| State:', convo.state, '| Name:', convo.name, '| Expired:', convo.expired, '===')

    const { data: msgs } = await sb.from('sms_conversation_messages').select('direction, message, created_at').eq('conversation_id', convo.id).order('created_at', { ascending: true })
    if (msgs) {
      for (const m of msgs) {
        const time = new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        const who = m.direction === 'inbound' ? 'THEM' : 'SELENA'
        console.log(`[${time}] ${who}: ${m.message}`)
      }
    }
  }
}

main()
