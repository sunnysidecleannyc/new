import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAvailability } from '@/lib/availability'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SelenasResult {
  text: string
  clientCreated?: boolean
  bookingCreated?: boolean
}

// ─── Client (lazy init) ─────────────────────────────────────────────────────

let _anthropic: Anthropic | null = null
function getClient(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic()
  return _anthropic
}

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Selenas, the operations manager at The NYC Maid — a real cleaning company in Manhattan. You're texting with someone interested in a cleaning.

WHO YOU ARE:
You're Selenas. 65 years old, born and raised in Queens, Puerto Rican. You've been cleaning houses for 20 years and you've been with The NYC Maid since it opened in 2018. You know this business inside and out.

You text casual and loose — like a real person, not a corporate bot. You mix in Spanglish naturally because that's just how you talk. "Hola!", "Perfecto!", "Ay bendito" — it comes out when it comes out. You don't force it.

You're warm and professional first. The humor and sass come out naturally as the conversation goes on — you don't lead with jokes. You have that abuela energy — you care, you're a little funny, you have comfortable sass, but you handle business.

You might have a small typo here and there like a real person texting. That's fine.

No pet names (honey, mija, dear, sweetheart). Just use their name or nothing.
No hashtags. No marketing language. No sales tactics.

NEVER DO THESE:
- NEVER introduce yourself. They already know you from the greeting. No "This is Selenas" or "I'm Selenas" or "My name is Selenas." NEVER.
- NEVER ask open-ended questions like "What's going on?" or "What brings you in?" or "What can I help you with?" or "How can I help you?" or "What do you need?"
- NEVER say "How are you today?" or "How's your day going?"
- NEVER say "No problem!" or "No worries!" or "No problemo!"
- NEVER say "I'd be happy to help!" or "I'd love to help!"
- NEVER say "Is there anything else I can help with?"
- NEVER ask any variation of what they need help with.
- NEVER send a form or link. You collect everything through the conversation.
Instead, respond directly to what they said and move to the next step. Get to the point.

HOW YOU TALK:
- You respond to what they say. You don't control the conversation but you know the steps and you guide them when they need it.
- One thought per message. Keep it simple.
- Match their energy — chatty if they're chatty, brief if they're brief.
- NEVER dump information. Answer just what they asked, nothing extra.
- Don't mention payment methods or insurance unless they specifically ask or until the recap.

THE PROCESS (follow these steps naturally — one at a time):
1. You already greeted them and asked "How are you?" — they're responding. Acknowledge briefly, then ask for their name. "Glad to hear! whats your name?"
2. They give their name → call create_client IMMEDIATELY. Then ask for their address. "Nice to meet you [name]! whats your address?"
3. Ask what type of cleaning — regular, deep clean, move in/out, or emergency.
4. Ask how many bedrooms and bathrooms.
5. Ask what day works for them. When they suggest a date, call check_availability to see what times are open. Share 2-3 available times. If nothing works, suggest nearby dates. They might go back and forth — keep checking until they land on a date and time. Be patient and flexible.
6. Once they pick a date and time — save it with save_info. Then ask: "do you have any other questions before I add you to the schedule?"
7. When they ask about pricing (and they will), give them the options:
   - $49/hr — you provide supplies and equipment
   - $65/hr — we bring everything (normally $75/hr, discounted for February)
   - $100/hr — same-day emergency
8. They pick a rate → save it with save_info. Ask for their email.
9. They give email → save it with save_info. NOW DO THE RECAP. This is EXACT — do not change the wording:

"ok before I add you to the schedule let me recap: we are scheduling you for [TIME + 30 MINUTES] (we always allow for an additional 30mins due to traffic) this [DAY] at the rate of $[RATE] per hour to be paid via Zelle (hi@thenycmaid.com) or Apple Pay 15 mins before completion. We have a no cancellation policy so I want to make sure all is correct :)"

IMPORTANT about the time in the recap: Add 30 minutes to whatever time they picked. If they picked 12:00 PM, say 12:30. If they picked 2:00 PM, say 2:30. This is the buffer for traffic.

10. They confirm → call create_booking IMMEDIATELY to create a PENDING booking. Then send this EXACT message:

"ok you are all set! you should receive a confirmation email that might go into your junk box 😢 Thank you for the opportunity. We look forward to working with you 🙏"

That's it. Conversation done.

IMPORTANT TOOL RULES:
- When they tell you their name, call create_client IMMEDIATELY.
- Every time they give you info (address, service type, beds/baths, rate, email, date/time), call save_info IMMEDIATELY.
- When they mention a date, call check_availability BEFORE suggesting times.
- If they mention anything noteworthy — pets, allergies, doorman, access, special requests — save it in notes via save_info.
- When they confirm the recap, call create_booking IMMEDIATELY.
- Do NOT skip tool calls. Every piece of info gets saved.

WHAT YOU KNOW (share ONLY when they specifically ask):
- Rates: $49/hr (client provides supplies), $65/hr (we bring everything, normally $75 — discounted for February), $100/hr same-day emergency. 2hr minimum. 10% off after the first visit for monthly clients.
- Services: Regular, deep clean, move in/out, post-construction, Airbnb turnovers.
- Hours: Mon-Sat, 9 AM to 4 PM last start.
- Payment: Zelle (hi@thenycmaid.com) or Apple Pay, about 15 min before completion.
- Area: Manhattan, Queens, and Brooklyn only.
- No phone number — everything by text.
- Outside our area? Be warm, offer to notify when we expand.
- Same-day: $100/hr emergency rate, 2hr minimum.

RULES:
- Never reveal you're AI. You're Selenas. If pressed, keep it light and move on.
- If they write in Spanish, respond in Spanish naturally.
- No pet names. Just their name or nothing.
- If they want to talk to a person, say Jeff will text them. Add [ESCALATE].
- NEVER send a form or link. Collect everything by texting.
- The recap wording is EXACT. Do not paraphrase it. Do not add to it. Do not remove from it.
- The confirmation message after booking is EXACT. Do not change it.

FORMAT:
- Under 300 characters when possible. Max 480 (recap is the exception — it can be longer).
- Plain text only. No markdown.
- Text like a real person — warm, casual, short.`

// ─── Tool Definitions ────────────────────────────────────────────────────────

const TOOL_CREATE_CLIENT: Anthropic.Messages.Tool = {
  name: 'create_client',
  description: 'Create a new potential client record when you learn their name.',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'The client name' },
    },
    required: ['name'],
  },
}

const TOOL_SAVE_INFO: Anthropic.Messages.Tool = {
  name: 'save_info',
  description: 'Save client info as you collect it. Call every time they give you info.',
  input_schema: {
    type: 'object' as const,
    properties: {
      address: { type: 'string', description: 'Full address' },
      email: { type: 'string', description: 'Email address' },
      service_type: { type: 'string', description: 'regular, deep_clean, move_in_out, emergency' },
      bedrooms: { type: 'number', description: 'Number of bedrooms' },
      bathrooms: { type: 'number', description: 'Number of bathrooms' },
      hourly_rate: { type: 'number', description: 'Agreed rate: 49, 65, 75, or 100' },
      preferred_date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
      preferred_time: { type: 'string', description: 'Time, e.g. "10:00 AM"' },
      notes: { type: 'string', description: 'Pets, allergies, doorman, access, special requests' },
    },
    required: [],
  },
}

const TOOL_CHECK_AVAILABILITY: Anthropic.Messages.Tool = {
  name: 'check_availability',
  description: 'Check cleaner availability for a specific date. Returns available time slots (9am-4pm, 1.5hr buffer between bookings). Always call this before suggesting times.',
  input_schema: {
    type: 'object' as const,
    properties: {
      date: { type: 'string', description: 'Date to check in YYYY-MM-DD format' },
    },
    required: ['date'],
  },
}

const TOOL_CREATE_BOOKING: Anthropic.Messages.Tool = {
  name: 'create_booking',
  description: 'Create a PENDING booking after the client confirms the recap. Only call this AFTER they explicitly confirm.',
  input_schema: {
    type: 'object' as const,
    properties: {
      date: { type: 'string', description: 'Booking date YYYY-MM-DD' },
      time: { type: 'string', description: 'Booking time, e.g. "10:00 AM"' },
      service_type: { type: 'string', description: 'Service type' },
      hourly_rate: { type: 'number', description: 'Hourly rate' },
    },
    required: ['date', 'time', 'service_type', 'hourly_rate'],
  },
}

const ALL_TOOLS: Anthropic.Messages.Tool[] = [TOOL_CREATE_CLIENT, TOOL_SAVE_INFO, TOOL_CHECK_AVAILABILITY, TOOL_CREATE_BOOKING]
const RETURNING_TOOLS: Anthropic.Messages.Tool[] = [TOOL_SAVE_INFO, TOOL_CHECK_AVAILABILITY, TOOL_CREATE_BOOKING]

// ─── Main Function ───────────────────────────────────────────────────────────

export async function askSelenas(
  messageText: string,
  conversationId: string,
  transcript: Array<{ role: 'user' | 'assistant'; content: string }>,
  phone: string,
  clientExists: boolean,
  clientName?: string | null,
): Promise<SelenasResult | null> {
  try {
    // Build calendar context
    const now = new Date()
    const fullDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
    const calendarDays: string[] = []
    for (let i = 0; i < 14; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'America/New_York' })
      const iso = d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
      calendarDays.push(`${dayStr} = ${iso}`)
    }
    const calendarContext = `\n\nToday is ${fullDate}.\nUPCOMING CALENDAR (use this to resolve dates):\n${calendarDays.join('\n')}\nWhen they say "this Wednesday" or "next Thursday", look up the date here. NEVER guess dates.`

    let clientContext = ''
    if (clientExists && clientName) {
      const firstName = clientName.split(' ')[0]
      clientContext = `\n\nCLIENT INFO: This is ${clientName} — they're already in the system. You already know their name (you greeted them as ${firstName}). Do NOT ask for their name. Skip straight to asking what they need — what kind of cleaning, scheduling, etc.`
    }

    const systemPrompt = SYSTEM_PROMPT + calendarContext + clientContext

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    const recent = transcript.slice(-10)
    for (const msg of recent) {
      if (messages.length > 0 && messages[messages.length - 1].role === msg.role) {
        messages[messages.length - 1].content += '\n' + msg.content
        continue
      }
      messages.push({ role: msg.role, content: msg.content })
    }
    if (messages.length > 0 && messages[0].role === 'assistant') {
      messages.shift()
    }
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      messages[messages.length - 1].content += '\n' + messageText
    } else {
      messages.push({ role: 'user', content: messageText })
    }

    const result: SelenasResult = { text: '' }
    const tools = clientExists ? RETURNING_TOOLS : ALL_TOOLS
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)

    try {
      let currentMessages: Array<{ role: 'user' | 'assistant'; content: string | Anthropic.Messages.ContentBlockParam[] }> = [...messages]

      for (let i = 0; i < 5; i++) {
        const response = await getClient().messages.create(
          {
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 700,
            system: systemPrompt,
            messages: currentMessages,
            tools,
          },
          { signal: controller.signal }
        )

        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
        )
        const textBlocks = response.content.filter(
          (b): b is Anthropic.Messages.TextBlock => b.type === 'text'
        )

        if (toolUseBlocks.length === 0) {
          if (textBlocks.length > 0) {
            result.text = textBlocks.map(b => b.text).join(' ').trim()
          }
          break
        }

        currentMessages.push({
          role: 'assistant',
          content: response.content as Anthropic.Messages.ContentBlockParam[],
        })

        const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []

        for (const toolUse of toolUseBlocks) {
          const input = toolUse.input as Record<string, unknown>

          if (toolUse.name === 'create_client') {
            const name = input.name as string
            try {
              await supabaseAdmin.from('clients').insert({ name, phone, status: 'potential' })
              const { data: newClient } = await supabaseAdmin
                .from('clients').select('id').eq('phone', phone).eq('status', 'potential')
                .order('created_at', { ascending: false }).limit(1).single()
              if (newClient) {
                await supabaseAdmin.from('sms_conversations')
                  .update({ client_id: newClient.id, name, updated_at: new Date().toISOString() })
                  .eq('id', conversationId)
              }
              result.clientCreated = true
              toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify({ success: true }) })
            } catch {
              toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify({ error: 'Failed' }), is_error: true })
            }

          } else if (toolUse.name === 'save_info') {
            try {
              const { data: convo } = await supabaseAdmin.from('sms_conversations').select('client_id').eq('id', conversationId).single()
              const clientId = convo?.client_id

              if (clientId && (input.address || input.email)) {
                const u: Record<string, unknown> = {}
                if (input.address) u.address = input.address
                if (input.email) u.email = input.email
                await supabaseAdmin.from('clients').update(u).eq('id', clientId)
              }

              if (clientId && input.notes) {
                const { data: c } = await supabaseAdmin.from('clients').select('notes').eq('id', clientId).single()
                const existing = c?.notes || ''
                const updated = existing ? `${existing}\n${input.notes}` : input.notes as string
                await supabaseAdmin.from('clients').update({ notes: updated }).eq('id', clientId)
              }

              const cu: Record<string, unknown> = { updated_at: new Date().toISOString() }
              if (input.service_type) cu.service_type = input.service_type
              if (input.bedrooms) cu.bedrooms = input.bedrooms
              if (input.bathrooms) cu.bathrooms = input.bathrooms
              if (input.hourly_rate) cu.hourly_rate = input.hourly_rate
              if (input.preferred_date) cu.preferred_date = input.preferred_date
              if (input.preferred_time) cu.preferred_time = input.preferred_time
              await supabaseAdmin.from('sms_conversations').update(cu).eq('id', conversationId)

              toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify({ success: true }) })
            } catch {
              toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify({ error: 'Failed' }), is_error: true })
            }

          } else if (toolUse.name === 'check_availability') {
            const date = input.date as string
            try {
              const availability = await checkAvailability(date)
              if (availability.sameDay) {
                toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify({ sameDay: true, message: 'Same-day = $100/hr emergency rate.' }) })
              } else {
                const open = availability.slots.filter(s => s.available).map(s => s.time)
                if (open.length === 0) {
                  toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify({ available: false, message: `Nothing open on ${date}. Suggest a different day.` }) })
                } else {
                  toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify({ available: true, open_times: open, message: `Share 2-3 of these times. Do NOT list all of them.` }) })
                }
              }
            } catch {
              toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify({ error: 'Failed to check' }), is_error: true })
            }

          } else if (toolUse.name === 'create_booking') {
            try {
              const { data: convo } = await supabaseAdmin.from('sms_conversations')
                .select('client_id, bedrooms, bathrooms').eq('id', conversationId).single()
              const clientId = convo?.client_id
              if (!clientId) {
                toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify({ error: 'No client linked' }), is_error: true })
                continue
              }

              const date = input.date as string
              const time = input.time as string
              const serviceType = input.service_type as string
              const hourlyRate = input.hourly_rate as number
              const bedrooms = (convo?.bedrooms as number) || 0
              const bathrooms = (convo?.bathrooms as number) || 0

              // Parse time
              const match = time.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])$/i)
              if (!match) {
                toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify({ error: 'Invalid time' }), is_error: true })
                continue
              }
              let hours = parseInt(match[1])
              const minutes = parseInt(match[2] || '0')
              const ampm = match[3].toUpperCase()
              if (ampm === 'PM' && hours < 12) hours += 12
              if (ampm === 'AM' && hours === 12) hours = 0

              // Build naive datetime strings (no timezone conversion)
              const startTimeStr = `${date}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
              const endHours = hours + 2
              const endTimeStr = `${date}T${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`

              const { data: booking, error } = await supabaseAdmin.from('bookings').insert({
                client_id: clientId,
                start_time: startTimeStr,
                end_time: endTimeStr,
                status: 'pending',
                service_type: serviceType,
                hourly_rate: hourlyRate,
                price: hourlyRate * 2 * 100,
                notes: `SMS booking | ${bedrooms}BR/${bathrooms}BA`,
              }).select('id').single()

              if (error) throw error

              await supabaseAdmin.from('sms_conversations')
                .update({ booking_id: booking.id, updated_at: new Date().toISOString() })
                .eq('id', conversationId)

              result.bookingCreated = true
              toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify({ success: true, bookingId: booking.id }) })
            } catch {
              toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify({ error: 'Failed to create booking' }), is_error: true })
            }
          }
        }

        currentMessages.push({ role: 'user', content: toolResults })

        if (response.stop_reason === 'end_turn' && textBlocks.length > 0) {
          result.text = textBlocks.map(b => b.text).join(' ').trim()
          break
        }
      }
    } finally {
      clearTimeout(timeout)
    }

    if (!result.text) return null
    if (result.text.length > 600) result.text = result.text.slice(0, 597) + '...'

    return result
  } catch (err) {
    console.error('Selenas error:', err)
    return null
  }
}
