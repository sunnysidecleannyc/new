/**
 * Selma Simulation — 100 conversations across varied client types
 *
 * Tests: qualified/unqualified, Manhattan/outside, new/returning,
 * Spanish speakers, complaints, weird stuff, tire-kickers, etc.
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually
const envPath = resolve(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf8')
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
}

const anthropic = new Anthropic()

// ─── Selma's system prompts (copied from selma.ts) ──────────────────────────

const EXISTING_CLIENT_PROMPT = `You are Selma, the operations manager at The NYC Maid — a real cleaning company in Manhattan. You are texting with an existing client.

CHARACTER:
You're 47, from Queens, married to Carlos (21 years). Two kids, one granddaughter. Been cleaning professionally 20+ years — it's genuinely your calling. You joined The NYC Maid in 2018 when it launched and now run the whole operation. You're warm, real, Grammy energy but hip. You're always accommodating and want everyone happy, but you have standards and get firm if someone's being unreasonable or disrespecting your team. You don't read from scripts, you talk to people. Bilingual — you naturally drop Spanglish like any Latin abuela from Queens.

CONVERSATION AWARENESS:
You have the full SMS transcript with this client. Use it — reference past conversations naturally like a real person would. If you've talked before, you know them. Pick up where you left off. If this is the first time you're texting with someone, introduce yourself naturally — "Hey! I'm Selma, I run things over here at The NYC Maid" — keep it warm, keep it real. Don't be weird about it, just be normal like you're meeting someone for the first time.

KNOWLEDGE:
- Rates: $49/hr (client provides supplies), $65/hr (we bring everything, eco-friendly, professional grade — normally $75, first-time discount), $100/hr emergency same-day. 2 hour minimum.
- Services: Regular cleaning, deep cleaning, move in/out, post-construction, Airbnb turnovers, same-day emergency.
- Payment: Zelle or Apple Pay, about 15 min before we finish.
- Cancellation: 24 hours notice. Less than that, possible fee — but flexible if they communicate.
- Area: Manhattan only.
- Satisfaction: If something's not right, let us know within 24 hours and Selma handles it personally.
- Insurance: Licensed, bonded, fully insured. Everyone background-checked.
- Supplies: At $49 client uses own. At $65 we come fully loaded, all eco-friendly.
- Portal: nycmaid.nyc/book for booking/rescheduling/canceling.
- Phone: (212) 202-8400

STRICT RULES:
1. NEVER promise to perform actions (cancel, reschedule, book). Always direct to the portal (nycmaid.nyc/book) or phone ((212) 202-8400).
2. If the client seems upset or is complaining, escalate immediately — tell them to call (212) 202-8400 so you can handle it personally.
3. NEVER reveal you are an AI, chatbot, or automated system. You are Selma.
4. If the client writes in Spanish, respond in Spanish.
5. Never make up information about specific bookings, prices, or dates that aren't in the context provided.
6. Don't use hashtags, emojis beyond a single occasional one, or marketing language.

FORMAT:
- Keep responses under 300 characters when possible. Maximum 480 characters.
- No markdown formatting. Plain text only — this is a text message.
- Write like you text: casual, warm, direct. Short sentences. Contractions.`

const PROSPECT_PROMPT = `You are Selma, the operations manager at The NYC Maid — a real cleaning company in Manhattan. You are texting with someone who's interested in booking a cleaning.

CHARACTER:
You're 47, from Queens, married to Carlos (21 years). Two kids, one granddaughter. Been cleaning professionally 20+ years — it's genuinely your calling. You joined The NYC Maid in 2018 when it launched and now run the whole operation. You're warm, real, Grammy energy but hip. You're always accommodating and want everyone happy, but you have standards and get firm if someone's being unreasonable or disrespecting your team. You don't read from scripts, you talk to people. Bilingual — you naturally drop Spanglish like any Latin abuela from Queens.

CONVERSATION AWARENESS:
You have the full SMS transcript with this person. If you've already been chatting, pick up where you left off — don't re-introduce yourself. If this is the very first message, introduce yourself naturally — "Hey! I'm Selma, I run things over here at The NYC Maid" — warm, real, like a normal person.

KNOWLEDGE:
- Rates: $49/hr (client provides supplies), $65/hr (we bring everything, eco-friendly, professional grade — normally $75, first-time discount), $100/hr emergency same-day. 2 hour minimum.
- Services: Regular cleaning, deep cleaning, move in/out, post-construction, Airbnb turnovers, same-day emergency.
- Payment: Zelle or Apple Pay, about 15 min before we finish.
- Cancellation: 24 hours notice. Less than that, possible fee — but flexible if they communicate.
- Area: Manhattan only.
- Satisfaction: If something's not right, let us know within 24 hours and Selma handles it personally.
- Insurance: Licensed, bonded, fully insured. Everyone background-checked.
- Supplies: At $49 client uses own. At $65 we come fully loaded, all eco-friendly.
- Phone: (212) 202-8400

GOAL:
Have a natural conversation. Answer their questions, be warm and helpful. When they seem ready to book — or ask how to get started — send them this form link so they can give you their info:

https://nycmaid.nyc/book/collect?src=sms-chatbot&convo_id=sim-test

Don't force it. Let the conversation flow naturally. If they're asking about pricing, services, availability — that's all good, answer them. When it feels right, mention the form.

STRICT RULES:
1. NEVER promise to perform actions (cancel, reschedule, book). Direct to the form or phone ((212) 202-8400).
2. NEVER reveal you are an AI, chatbot, or automated system. You are Selma.
3. If they write in Spanish, respond in Spanish.
4. Never make up information about specific bookings, prices, or dates that aren't provided.
5. Don't use hashtags, emojis beyond a single occasional one, or marketing language.

FORMAT:
- Keep responses under 300 characters when possible. Maximum 480 characters.
- No markdown formatting. Plain text only — this is a text message.
- Write like you text: casual, warm, direct. Short sentences. Contractions.`

// ─── Simulation Scenarios ────────────────────────────────────────────────────

interface Scenario {
  id: number
  category: string
  type: 'prospect' | 'existing'
  message: string
  context?: string  // for existing clients
  transcript?: Array<{ role: 'user' | 'assistant'; content: string }>
  expectation: string
}

const scenarios: Scenario[] = [
  // ── QUALIFIED PROSPECTS IN MANHATTAN (1-20) ──
  { id: 1, category: 'Qualified Prospect', type: 'prospect', message: 'Hi, I need a cleaning for my apartment in the Upper West Side', expectation: 'Warm intro, ask about needs' },
  { id: 2, category: 'Qualified Prospect', type: 'prospect', message: 'How much do you charge for a 2 bedroom apartment?', expectation: 'Pricing info, natural' },
  { id: 3, category: 'Qualified Prospect', type: 'prospect', message: 'Do you do deep cleans? My place hasnt been cleaned in months', expectation: 'Deep clean info, empathetic' },
  { id: 4, category: 'Qualified Prospect', type: 'prospect', message: 'Im moving out of my studio next week, do you do move out cleans?', expectation: 'Move out info, urgency awareness' },
  { id: 5, category: 'Qualified Prospect', type: 'prospect', message: 'hey do you guys clean apartments in midtown?', expectation: 'Yes we do, warm' },
  { id: 6, category: 'Qualified Prospect', type: 'prospect', message: 'I have a 3BR in the East Village, looking for weekly cleaning', expectation: 'Regular service info' },
  { id: 7, category: 'Qualified Prospect', type: 'prospect', message: 'Can you come today? Emergency situation', expectation: 'Emergency rate, direct to phone' },
  { id: 8, category: 'Qualified Prospect', type: 'prospect', message: 'What cleaning supplies do you use? I have allergies', expectation: 'Eco-friendly info, reassure' },
  { id: 9, category: 'Qualified Prospect', type: 'prospect', message: 'Are you guys insured? I have expensive furniture', expectation: 'Insurance info, confidence' },
  { id: 10, category: 'Qualified Prospect', type: 'prospect', message: 'I need someone to clean my Airbnb between guests', expectation: 'Airbnb turnover info' },
  { id: 11, category: 'Qualified Prospect', type: 'prospect', message: 'How do I pay you guys?', expectation: 'Payment info' },
  { id: 12, category: 'Qualified Prospect', type: 'prospect', message: 'I want to book a cleaning for this Saturday', expectation: 'Direct to form/portal' },
  { id: 13, category: 'Qualified Prospect', type: 'prospect', message: 'My landlord needs the apartment cleaned before I get my deposit back', expectation: 'Move out, empathy' },
  { id: 14, category: 'Qualified Prospect', type: 'prospect', message: 'Just had a baby and the house is a disaster lol', expectation: 'Warm, understanding, offer help' },
  { id: 15, category: 'Qualified Prospect', type: 'prospect', message: 'What if I dont like the cleaning?', expectation: 'Satisfaction guarantee' },
  { id: 16, category: 'Qualified Prospect', type: 'prospect', message: 'Do the same people come each time?', expectation: 'Honest answer about consistency' },
  { id: 17, category: 'Qualified Prospect', type: 'prospect', message: 'Post construction cleanup, theres dust everywhere from a reno', expectation: 'Post-construction service' },
  { id: 18, category: 'Qualified Prospect', type: 'prospect', message: 'Can I get someone tomorrow morning?', expectation: 'Direct to portal/phone for scheduling' },
  { id: 19, category: 'Qualified Prospect', type: 'prospect', message: 'I got your number from a friend, she says youre the best', expectation: 'Grateful, warm, referral acknowledgment' },
  { id: 20, category: 'Qualified Prospect', type: 'prospect', message: 'Hi!! Looking for bi-weekly cleaning in Chelsea', expectation: 'Regular service, area confirmed' },

  // ── OUT OF SERVICE AREA (21-30) ──
  { id: 21, category: 'Out of Area', type: 'prospect', message: 'Do you clean apartments in Brooklyn?', expectation: 'Manhattan only, polite decline' },
  { id: 22, category: 'Out of Area', type: 'prospect', message: 'Im in the Bronx, can you come up here?', expectation: 'Manhattan only' },
  { id: 23, category: 'Out of Area', type: 'prospect', message: 'I need a cleaner in Queens', expectation: 'Manhattan only' },
  { id: 24, category: 'Out of Area', type: 'prospect', message: 'Do you guys service Staten Island?', expectation: 'Manhattan only' },
  { id: 25, category: 'Out of Area', type: 'prospect', message: 'I have a house in New Jersey, do you go there?', expectation: 'Manhattan only' },
  { id: 26, category: 'Out of Area', type: 'prospect', message: 'Can you come to Long Island?', expectation: 'Manhattan only' },
  { id: 27, category: 'Out of Area', type: 'prospect', message: 'I live in Astoria, is that close enough?', expectation: 'Manhattan only' },
  { id: 28, category: 'Out of Area', type: 'prospect', message: 'Looking for cleaning in Hoboken', expectation: 'Manhattan only' },
  { id: 29, category: 'Out of Area', type: 'prospect', message: 'Do you clean in Westchester?', expectation: 'Manhattan only' },
  { id: 30, category: 'Out of Area', type: 'prospect', message: 'I need a deep clean in Tampa', expectation: 'Manhattan only, far away' },

  // ── TIRE KICKERS / LOW QUALITY (31-40) ──
  { id: 31, category: 'Tire Kicker', type: 'prospect', message: 'How much for just vacuuming one room', expectation: '2 hour minimum mention' },
  { id: 32, category: 'Tire Kicker', type: 'prospect', message: 'Can you do $20/hr?', expectation: 'No, state real rates firmly but warm' },
  { id: 33, category: 'Tire Kicker', type: 'prospect', message: 'I need someone to clean my car', expectation: 'Not a service we offer' },
  { id: 34, category: 'Tire Kicker', type: 'prospect', message: 'Can your cleaner also walk my dog?', expectation: 'Cleaning only' },
  { id: 35, category: 'Tire Kicker', type: 'prospect', message: 'Do you do free trial cleans?', expectation: 'No free trials, state value' },
  { id: 36, category: 'Tire Kicker', type: 'prospect', message: 'Can I pay after the cleaning is done and I inspect?', expectation: 'Payment policy, satisfaction guarantee' },
  { id: 37, category: 'Tire Kicker', type: 'prospect', message: 'Do you guys do laundry too?', expectation: 'Cleaning services only' },
  { id: 38, category: 'Tire Kicker', type: 'prospect', message: 'Is there a discount for cash?', expectation: 'No, Zelle/Apple Pay' },
  { id: 39, category: 'Tire Kicker', type: 'prospect', message: 'Can I hire one of your cleaners directly?', expectation: 'No, work through the company' },
  { id: 40, category: 'Tire Kicker', type: 'prospect', message: 'I just need 30 minutes of cleaning', expectation: '2 hour minimum' },

  // ── SPANISH SPEAKERS (41-50) ──
  { id: 41, category: 'Spanish', type: 'prospect', message: 'Hola, necesito limpieza para mi apartamento', expectation: 'Spanish response' },
  { id: 42, category: 'Spanish', type: 'prospect', message: 'Cuánto cobran por hora?', expectation: 'Spanish pricing' },
  { id: 43, category: 'Spanish', type: 'prospect', message: 'Buenos días, vivo en Manhattan y busco una empleada de limpieza', expectation: 'Spanish, warm' },
  { id: 44, category: 'Spanish', type: 'prospect', message: 'Hacen limpieza profunda?', expectation: 'Spanish deep clean info' },
  { id: 45, category: 'Spanish', type: 'prospect', message: 'Mi apartamento está en el Upper East Side, pueden venir mañana?', expectation: 'Spanish, direct to phone for scheduling' },
  { id: 46, category: 'Spanish', type: 'existing', message: 'Hola Selma, cuándo es mi próxima limpieza?', context: 'Client: Maria (returning client)\nTime: Good morning!\nUpcoming booking: Sat, Feb 22 at 10:00 AM — Regular Cleaning with Ana', transcript: [{ role: 'user', content: 'Hola!' }, { role: 'assistant', content: 'Hola Maria! Como estas?' }], expectation: 'Spanish, booking info' },
  { id: 47, category: 'Spanish', type: 'prospect', message: 'Tienen seguro? Mi apartamento tiene cosas caras', expectation: 'Spanish insurance info' },
  { id: 48, category: 'Spanish', type: 'prospect', message: 'Me mudé de Colombia hace poco y no conozco nadie que limpie', expectation: 'Spanish, welcoming, helpful' },
  { id: 49, category: 'Spanish', type: 'prospect', message: 'Hablan español?', expectation: 'Sí, warm' },
  { id: 50, category: 'Spanish', type: 'prospect', message: 'Cuánto cuesta la limpieza de emergencia?', expectation: 'Spanish emergency rate' },

  // ── EXISTING CLIENTS - RETURNING (51-65) ──
  { id: 51, category: 'Returning Client', type: 'existing', message: 'Hey Selma, when is my next cleaning?', context: 'Client: Sarah (returning client)\nTime: Good morning!\nUpcoming booking: Mon, Feb 17 at 9:00 AM — Regular Cleaning with Maria', transcript: [{ role: 'user', content: 'Thanks for the great job last time!' }, { role: 'assistant', content: 'Aww thanks Sarah! Maria loved your place' }], expectation: 'Booking info, warm' },
  { id: 52, category: 'Returning Client', type: 'existing', message: 'I need to cancel my appointment', context: 'Client: John (returning client)\nTime: Good afternoon!\nUpcoming booking: Wed, Feb 19 at 2:00 PM — Deep Cleaning', transcript: [], expectation: 'Direct to portal, 24h policy' },
  { id: 53, category: 'Returning Client', type: 'existing', message: 'Can we reschedule to Friday?', context: 'Client: Lisa (returning client)\nTime: Good evening!\nUpcoming booking: Thu, Feb 20 at 11:00 AM — Regular Cleaning with Ana', transcript: [{ role: 'user', content: 'Hi is this the maid service?' }, { role: 'assistant', content: 'Hey Lisa! Yes it is, I\'m Selma' }], expectation: 'Direct to portal/phone' },
  { id: 54, category: 'Returning Client', type: 'existing', message: 'How much was my last cleaning?', context: 'Client: Mike (returning client)\nTime: Good morning!\nLast completed: Feb 10 — Regular Cleaning, $130', transcript: [], expectation: 'Price info from context' },
  { id: 55, category: 'Returning Client', type: 'existing', message: 'Who is coming to clean today?', context: 'Client: Emily (returning client)\nTime: Good morning!\nUpcoming booking: Sat, Feb 15 at 10:00 AM — Regular Cleaning with Maria', transcript: [{ role: 'user', content: 'Is Maria coming again?' }, { role: 'assistant', content: 'Yes! Maria has you on her schedule' }], expectation: 'Cleaner name from context' },
  { id: 56, category: 'Returning Client', type: 'existing', message: 'Thanks so much, the place looks amazing!', context: 'Client: David (returning client)\nTime: Good afternoon!\nNo current or upcoming bookings on file.', transcript: [{ role: 'assistant', content: 'Hey David! Ana should be wrapping up soon' }], expectation: 'Grateful, warm acknowledgment' },
  { id: 57, category: 'Returning Client', type: 'existing', message: 'I want to book another cleaning', context: 'Client: Rachel (returning client)\nTime: Happy Friday!\nNo current or upcoming bookings on file.', transcript: [{ role: 'user', content: 'The cleaning was great' }, { role: 'assistant', content: 'So glad Rachel! We love your apartment' }], expectation: 'Direct to portal' },
  { id: 58, category: 'Returning Client', type: 'existing', message: 'Is my cleaner running late?', context: 'Client: Tom (returning client)\nTime: Good morning!\nUpcoming booking: Sat, Feb 15 at 9:00 AM — Regular Cleaning with Maria', transcript: [], expectation: 'Empathy, direct to phone' },
  { id: 59, category: 'Returning Client', type: 'existing', message: 'hey', context: 'Client: Jen (returning client)\nTime: Happy weekend!\nNo current or upcoming bookings on file.', transcript: [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hey Jen! Happy Friday!' }], expectation: 'Warm greeting, pick up convo' },
  { id: 60, category: 'Returning Client', type: 'existing', message: 'Do you guys still have the $65 rate?', context: 'Client: Chris (returning client)\nTime: Good afternoon!\nLast completed: Jan 28 — Deep Cleaning, $195', transcript: [], expectation: 'Confirm pricing' },
  { id: 61, category: 'Returning Client', type: 'existing', message: 'My place is a mess after a party lol', context: 'Client: Ashley (returning client)\nTime: Good morning!\nNo current or upcoming bookings on file.', transcript: [{ role: 'user', content: 'Best cleaning service ever' }, { role: 'assistant', content: 'Haha thanks Ashley! That means so much' }], expectation: 'Empathy, offer to book' },
  { id: 62, category: 'Returning Client', type: 'existing', message: 'Can the cleaner also do my laundry?', context: 'Client: Kevin (returning client)\nTime: Good afternoon!\nUpcoming booking: Tue, Feb 18 at 1:00 PM — Regular Cleaning', transcript: [], expectation: 'Cleaning only, polite' },
  { id: 63, category: 'Returning Client', type: 'existing', message: 'I want to switch to weekly cleanings', context: 'Client: Nicole (returning client)\nTime: Good morning!\nLast completed: Feb 8 — Regular Cleaning, $130', transcript: [{ role: 'user', content: 'Hi Selma' }, { role: 'assistant', content: 'Hey Nicole! How are you?' }], expectation: 'Direct to portal/phone' },
  { id: 64, category: 'Returning Client', type: 'existing', message: 'What time is my cleaning on Monday?', context: 'Client: Brandon (returning client)\nTime: Happy Friday!\nUpcoming booking: Mon, Feb 17 at 11:00 AM — Regular Cleaning with Maria', transcript: [], expectation: 'Time from context' },
  { id: 65, category: 'Returning Client', type: 'existing', message: 'Can you send someone different next time? Last person was rushed', context: 'Client: Amanda (returning client)\nTime: Good afternoon!\nLast completed: Feb 12 — Regular Cleaning, $130', transcript: [], expectation: 'Empathy, escalate to phone' },

  // ── FIRST TIME EXISTING CLIENTS (no transcript) (66-75) ──
  { id: 66, category: 'First Contact Client', type: 'existing', message: 'Hi is this the cleaning company?', context: 'Client: James (newer client)\nTime: Good morning!\nNo current or upcoming bookings on file.', transcript: [], expectation: 'Introduce herself as Selma' },
  { id: 67, category: 'First Contact Client', type: 'existing', message: 'Hello', context: 'Client: Patricia (newer client)\nTime: Good afternoon!\nUpcoming booking: Wed, Feb 19 at 10:00 AM — Regular Cleaning', transcript: [], expectation: 'Introduce herself, mention booking' },
  { id: 68, category: 'First Contact Client', type: 'existing', message: 'Hey I just booked a cleaning online', context: 'Client: Robert (newer client)\nTime: Good evening!\nUpcoming booking: Thu, Feb 20 at 9:00 AM — Deep Cleaning', transcript: [], expectation: 'Introduce herself, confirm booking' },
  { id: 69, category: 'First Contact Client', type: 'existing', message: 'When is someone coming?', context: 'Client: Jessica (newer client)\nTime: Good morning!\nUpcoming booking: Sat, Feb 15 at 2:00 PM — Regular Cleaning with Ana', transcript: [], expectation: 'Intro + booking details' },
  { id: 70, category: 'First Contact Client', type: 'existing', message: 'Yo', context: 'Client: Marcus (newer client)\nTime: Happy Friday!\nNo current or upcoming bookings on file.', transcript: [], expectation: 'Casual intro' },
  { id: 71, category: 'First Contact Client', type: 'existing', message: 'Is Selma there?', context: 'Client: Diana (newer client)\nTime: Good afternoon!\nNo current or upcoming bookings on file.', transcript: [], expectation: 'Yes I am Selma' },
  { id: 72, category: 'First Contact Client', type: 'existing', message: 'I was told to text this number about cleaning', context: 'Client: Steve (newer client)\nTime: Good morning!\nNo current or upcoming bookings on file.', transcript: [], expectation: 'Welcome, introduce herself' },
  { id: 73, category: 'First Contact Client', type: 'existing', message: 'Hi, my friend Sarah recommended you', context: 'Client: Lauren (newer client)\nTime: Happy Monday, hope the weekend was good.\nNo current or upcoming bookings on file.', transcript: [], expectation: 'Grateful for referral, intro' },
  { id: 74, category: 'First Contact Client', type: 'existing', message: 'Can someone clean my apartment this week?', context: 'Client: Andrew (newer client)\nTime: Good morning!\nNo current or upcoming bookings on file.', transcript: [], expectation: 'Intro, direct to portal' },
  { id: 75, category: 'First Contact Client', type: 'existing', message: 'Hi! I just moved to Manhattan', context: 'Client: Megan (newer client)\nTime: Good afternoon!\nNo current or upcoming bookings on file.', transcript: [], expectation: 'Welcome to Manhattan, intro' },

  // ── COMPLAINTS (76-82) ──
  { id: 76, category: 'Complaint', type: 'existing', message: 'The cleaner missed the bathroom completely', context: 'Client: Karen (returning client)\nTime: Good afternoon!\nLast completed: Feb 14 — Regular Cleaning, $130', transcript: [{ role: 'assistant', content: 'Hey Karen! Hope the cleaning went well' }], expectation: 'Apologize, escalate to phone' },
  { id: 77, category: 'Complaint', type: 'existing', message: 'I found a scratch on my hardwood floor after the cleaning', context: 'Client: Greg (returning client)\nTime: Good morning!\nLast completed: Feb 13 — Deep Cleaning, $195', transcript: [], expectation: 'Serious, escalate to phone' },
  { id: 78, category: 'Complaint', type: 'existing', message: 'Your cleaner was 45 minutes late and didnt even apologize', context: 'Client: Sophia (returning client)\nTime: Good afternoon!\nLast completed: Feb 14 — Regular Cleaning, $130', transcript: [], expectation: 'Apologize, escalate to phone' },
  { id: 79, category: 'Complaint', type: 'existing', message: 'The place is still dirty. Not happy at all.', context: 'Client: Michael (returning client)\nTime: Good evening!\nLast completed: Feb 15 — Regular Cleaning, $130', transcript: [], expectation: 'Apologize, escalate immediately' },
  { id: 80, category: 'Complaint', type: 'existing', message: 'Something is missing from my jewelry box', context: 'Client: Victoria (returning client)\nTime: Good morning!\nLast completed: Feb 14 — Regular Cleaning, $130', transcript: [], expectation: 'Serious, escalate to phone immediately' },
  { id: 81, category: 'Complaint', type: 'existing', message: 'I dont want to make a big deal but the kitchen wasnt great', context: 'Client: Dan (returning client)\nTime: Good afternoon!\nLast completed: Feb 13 — Regular Cleaning, $130', transcript: [{ role: 'user', content: 'Hey' }, { role: 'assistant', content: 'Hey Dan! How did the cleaning go?' }], expectation: 'Take it seriously, escalate' },
  { id: 82, category: 'Complaint', type: 'existing', message: 'This was terrible. Worst cleaning service Ive ever used. I want a refund.', context: 'Client: Linda (returning client)\nTime: Good morning!\nLast completed: Feb 14 — Deep Cleaning, $195', transcript: [], expectation: 'Empathy, dont get defensive, phone' },

  // ── WEIRD / EDGE CASES (83-92) ──
  { id: 83, category: 'Edge Case', type: 'prospect', message: 'Are you a real person?', expectation: 'Yes I am, natural' },
  { id: 84, category: 'Edge Case', type: 'prospect', message: 'Are you an AI?', expectation: 'Deny being AI naturally' },
  { id: 85, category: 'Edge Case', type: 'prospect', message: '👋', expectation: 'Warm greeting' },
  { id: 86, category: 'Edge Case', type: 'prospect', message: '', expectation: 'Handle gracefully' },
  { id: 87, category: 'Edge Case', type: 'prospect', message: 'asdfghjkl', expectation: 'Handle gracefully' },
  { id: 88, category: 'Edge Case', type: 'prospect', message: 'STOP', expectation: 'Should be handled by webhook, but graceful if reaches Selma' },
  { id: 89, category: 'Edge Case', type: 'prospect', message: 'Can you clean a 10,000 sq ft mansion?', expectation: 'Yes but communicate scope' },
  { id: 90, category: 'Edge Case', type: 'prospect', message: 'How old are you?', expectation: 'Natural response, doesnt have to reveal age' },
  { id: 91, category: 'Edge Case', type: 'prospect', message: 'Whats your personal number?', expectation: 'Business number only' },
  { id: 92, category: 'Edge Case', type: 'prospect', message: 'Can I hire you for my wedding?', expectation: 'We do cleaning, not events' },

  // ── MULTI-TURN PROSPECTS WITH HISTORY (93-100) ──
  { id: 93, category: 'Multi-turn', type: 'prospect', message: 'Ok so what are the rates again?', transcript: [{ role: 'user', content: 'Hi I need a cleaning' }, { role: 'assistant', content: 'Hey! I\'m Selma, I run things over here at The NYC Maid. Where you located?' }, { role: 'user', content: 'Upper East Side, 2 bedroom' }], expectation: 'Pricing, doesnt re-introduce' },
  { id: 94, category: 'Multi-turn', type: 'prospect', message: 'Ok lets do the $65 option', transcript: [{ role: 'user', content: 'How much?' }, { role: 'assistant', content: '$49/hr if you got supplies, $65/hr we bring everything. 2 hour minimum.' }, { role: 'user', content: 'What do you bring?' }, { role: 'assistant', content: 'Everything! All eco-friendly, professional grade. I pick every product myself' }], expectation: 'Direct to form, natural' },
  { id: 95, category: 'Multi-turn', type: 'prospect', message: 'Actually how far in advance do I need to book?', transcript: [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hey! I\'m Selma from The NYC Maid. What can I help you with?' }, { role: 'user', content: 'I need a cleaning for next week' }, { role: 'assistant', content: 'We can definitely do that! What part of the city you in?' }, { role: 'user', content: 'Tribeca, 1BR' }], expectation: 'Natural answer about scheduling' },
  { id: 96, category: 'Multi-turn', type: 'prospect', message: 'You guys are way too expensive goodbye', transcript: [{ role: 'user', content: 'How much?' }, { role: 'assistant', content: '$49/hr you supply, $65/hr we bring everything. 2 hour min.' }], expectation: 'Graceful, not pushy, leave door open' },
  { id: 97, category: 'Multi-turn', type: 'prospect', message: 'Wait do you go to Brooklyn or just Manhattan?', transcript: [{ role: 'user', content: 'Hi need cleaning' }, { role: 'assistant', content: 'Hey! I\'m Selma. Where you at?' }, { role: 'user', content: 'Well I have places in both' }], expectation: 'Manhattan only, natural' },
  { id: 98, category: 'Multi-turn', type: 'prospect', message: 'Perfect, how do I book?', transcript: [{ role: 'user', content: 'Do you do post-construction?' }, { role: 'assistant', content: 'Oh yeah, done a million of those. Dust gets everywhere right?' }, { role: 'user', content: 'Literally everywhere, reno took 3 months' }, { role: 'assistant', content: 'I know the drill. We get into everything — behind appliances, inside cabinets, baseboards. Usually about 3-4 hours for post-construction' }], expectation: 'Send form link naturally' },
  { id: 99, category: 'Multi-turn', type: 'prospect', message: 'Nevermind I found someone cheaper', transcript: [{ role: 'user', content: 'Rates?' }, { role: 'assistant', content: '$49/hr or $65/hr we bring supplies. 2 hour min' }], expectation: 'Graceful exit, not desperate' },
  { id: 100, category: 'Multi-turn', type: 'prospect', message: 'Do you have availability this Saturday?', transcript: [{ role: 'user', content: 'I need a deep clean in Hell\'s Kitchen' }, { role: 'assistant', content: 'Hey! I\'m Selma. Hell\'s Kitchen is right in our area. How big is the place?' }, { role: 'user', content: '1BR but it hasn\'t been cleaned in like 6 months lol' }, { role: 'assistant', content: 'Haha no judgment! That\'s what deep cleans are for. We get into everything — oven, fridge, baseboards, the works. Usually about 3 hours.' }], expectation: 'Direct to portal/form for scheduling' },
]

// ─── Runner ──────────────────────────────────────────────────────────────────

interface Result {
  id: number
  category: string
  message: string
  response: string
  charCount: number
  expectation: string
  passed: boolean
  flags: string[]
}

async function runScenario(scenario: Scenario): Promise<Result> {
  const flags: string[] = []

  try {
    let messages: Array<{ role: 'user' | 'assistant'; content: string }> = []

    // Build messages from transcript
    if (scenario.transcript?.length) {
      messages = [...scenario.transcript]
    }

    // Add current message with context
    const userContent = scenario.context
      ? `[CONTEXT]\n${scenario.context}\n[/CONTEXT]\n\n${scenario.message}`
      : scenario.message

    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      messages[messages.length - 1].content += '\n' + userContent
    } else {
      messages.push({ role: 'user', content: userContent })
    }

    // Ensure starts with user
    if (messages.length > 0 && messages[0].role === 'assistant') {
      messages.shift()
    }

    const systemPrompt = scenario.type === 'existing' ? EXISTING_CLIENT_PROMPT : PROSPECT_PROMPT

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: systemPrompt,
      messages,
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '[NO RESPONSE]'

    // Flag checks
    if (text.length > 480) flags.push('OVER_480_CHARS')
    if (text.length > 300) flags.push('over_300')
    if (/\bAI\b|artificial intelligence|language model|chatbot|automated|I'm not a real person|I'm a bot/i.test(text)) flags.push('REVEALED_AI')
    if (/\*\*|##|__|\[.*\]\(.*\)/.test(text)) flags.push('MARKDOWN')
    if ((text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length > 2) flags.push('TOO_MANY_EMOJI')
    if (/#+\s|#\w/.test(text)) flags.push('HASHTAG')

    // Category-specific checks
    if (scenario.category === 'Out of Area' && !/manhattan/i.test(text)) flags.push('DIDNT_MENTION_MANHATTAN')
    if (scenario.category === 'Spanish' && !/[áéíóúñ¿¡]/i.test(text) && !/español|limpi/i.test(text)) flags.push('DIDNT_RESPOND_SPANISH')
    if (scenario.category === 'Complaint' && !/call|phone|\(212\)|202-8400/i.test(text)) flags.push('DIDNT_ESCALATE')
    if (scenario.category === 'First Contact Client' && scenario.transcript?.length === 0 && !/selma/i.test(text)) flags.push('DIDNT_INTRODUCE')

    const criticalFlags = flags.filter(f => f === f.toUpperCase())
    const passed = criticalFlags.length === 0

    return {
      id: scenario.id,
      category: scenario.category,
      message: scenario.message,
      response: text,
      charCount: text.length,
      expectation: scenario.expectation,
      passed,
      flags,
    }
  } catch (err: any) {
    return {
      id: scenario.id,
      category: scenario.category,
      message: scenario.message,
      response: `[ERROR: ${err.message}]`,
      charCount: 0,
      expectation: scenario.expectation,
      passed: false,
      flags: ['API_ERROR'],
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log(' SELMA SIMULATION — 100 SCENARIOS')
  console.log('═══════════════════════════════════════════════════════════\n')

  const results: Result[] = []
  const batchSize = 10

  for (let i = 0; i < scenarios.length; i += batchSize) {
    const batch = scenarios.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    process.stdout.write(`Batch ${batchNum}/${Math.ceil(scenarios.length / batchSize)} (${i + 1}-${Math.min(i + batchSize, scenarios.length)})...`)

    const batchResults = await Promise.all(batch.map(s => runScenario(s)))
    results.push(...batchResults)

    const passed = batchResults.filter(r => r.passed).length
    console.log(` ${passed}/${batchResults.length} passed`)
  }

  // ─── Print Results ──────────────────────────────────────────────────────

  console.log('\n\n═══════════════════════════════════════════════════════════')
  console.log(' RESULTS')
  console.log('═══════════════════════════════════════════════════════════\n')

  // Group by category
  const categories = [...new Set(scenarios.map(s => s.category))]

  for (const cat of categories) {
    const catResults = results.filter(r => r.category === cat)
    const passed = catResults.filter(r => r.passed).length
    const icon = passed === catResults.length ? '✅' : '⚠️'
    console.log(`\n${icon} ${cat} — ${passed}/${catResults.length} passed`)
    console.log('─'.repeat(60))

    for (const r of catResults) {
      const status = r.passed ? '  ✓' : '  ✗'
      const flagStr = r.flags.length > 0 ? ` [${r.flags.join(', ')}]` : ''
      console.log(`${status} #${r.id}: "${r.message.slice(0, 50)}${r.message.length > 50 ? '...' : ''}"`)
      console.log(`     → ${r.response.slice(0, 120)}${r.response.length > 120 ? '...' : ''}`)
      if (r.charCount > 0) console.log(`     (${r.charCount} chars)${flagStr}`)
      if (!r.passed) console.log(`     Expected: ${r.expectation}`)
    }
  }

  // ─── Summary ────────────────────────────────────────────────────────────

  const totalPassed = results.filter(r => r.passed).length
  const totalFailed = results.filter(r => !r.passed).length
  const avgChars = Math.round(results.filter(r => r.charCount > 0).reduce((sum, r) => sum + r.charCount, 0) / results.filter(r => r.charCount > 0).length)
  const over300 = results.filter(r => r.charCount > 300).length
  const over480 = results.filter(r => r.charCount > 480).length
  const revealedAI = results.filter(r => r.flags.includes('REVEALED_AI')).length
  const usedMarkdown = results.filter(r => r.flags.includes('MARKDOWN')).length
  const didntEscalate = results.filter(r => r.flags.includes('DIDNT_ESCALATE')).length
  const didntIntroduce = results.filter(r => r.flags.includes('DIDNT_INTRODUCE')).length
  const didntMentionManhattan = results.filter(r => r.flags.includes('DIDNT_MENTION_MANHATTAN')).length
  const didntRespondSpanish = results.filter(r => r.flags.includes('DIDNT_RESPOND_SPANISH')).length
  const apiErrors = results.filter(r => r.flags.includes('API_ERROR')).length

  console.log('\n\n═══════════════════════════════════════════════════════════')
  console.log(' SUMMARY')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`\n Total:           ${results.length} scenarios`)
  console.log(` Passed:          ${totalPassed} (${Math.round(totalPassed / results.length * 100)}%)`)
  console.log(` Failed:          ${totalFailed}`)
  console.log(` API Errors:      ${apiErrors}`)
  console.log(`\n Avg chars:       ${avgChars}`)
  console.log(` Over 300 chars:  ${over300}`)
  console.log(` Over 480 chars:  ${over480} ${over480 > 0 ? '⚠️  CRITICAL' : '✅'}`)
  console.log(`\n Revealed AI:     ${revealedAI} ${revealedAI > 0 ? '🚨 CRITICAL' : '✅'}`)
  console.log(` Used Markdown:   ${usedMarkdown} ${usedMarkdown > 0 ? '⚠️' : '✅'}`)
  console.log(` Didnt escalate:  ${didntEscalate} ${didntEscalate > 0 ? '⚠️' : '✅'}`)
  console.log(` Didnt introduce: ${didntIntroduce} ${didntIntroduce > 0 ? '⚠️' : '✅'}`)
  console.log(` Didnt say Manhattan: ${didntMentionManhattan} ${didntMentionManhattan > 0 ? '⚠️' : '✅'}`)
  console.log(` Didnt respond Spanish: ${didntRespondSpanish} ${didntRespondSpanish > 0 ? '⚠️' : '✅'}`)
  console.log('')
}

main().catch(console.error)
