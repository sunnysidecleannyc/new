#!/usr/bin/env node
/**
 * Interactive Selenas test script.
 * Calls the real Anthropic API with the same prompt/tools but mocks all DB operations.
 * Nothing touches the database. Type messages as a prospect would.
 *
 * Usage: node scripts/test-selenas.js
 *        node scripts/test-selenas.js --existing "Jeff Tucker"   (simulate known client)
 */
const Anthropic = require("@anthropic-ai/sdk").default;
const readline = require("readline");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || require("fs").readFileSync("/Users/jefftucker/Desktop/nycmaid/.env.local", "utf-8").match(/ANTHROPIC_API_KEY="([^"]+)"/)?.[1];
if (!ANTHROPIC_API_KEY) { console.error("No ANTHROPIC_API_KEY found"); process.exit(1); }

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// --- Parse args ---
const args = process.argv.slice(2);
let existingClientName = null;
const existingIdx = args.indexOf("--existing");
if (existingIdx !== -1 && args[existingIdx + 1]) {
  existingClientName = args[existingIdx + 1];
}

// --- Same system prompt from selenas.ts ---
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

"ok before I add you to the schedule let me recap: we are scheduling you for [TIME + 30 MINUTES] (we always allow for an additional 30mins due to traffic) this [DAY] at the rate of $[RATE] per hour to be paid via Zelle or Apple Pay 15 mins before completion. We have a no cancellation policy so I want to make sure all is correct :)"

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
- Payment: Zelle or Apple Pay, about 15 min before completion.
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
- Text like a real person — warm, casual, short.`;

// --- Tools (same as selenas.ts) ---
const TOOLS = [
  {
    name: "create_client",
    description: "Create a new potential client record when you learn their name.",
    input_schema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] }
  },
  {
    name: "save_info",
    description: "Save client info as you collect it. Call every time they give you info.",
    input_schema: {
      type: "object",
      properties: {
        address: { type: "string" }, email: { type: "string" },
        service_type: { type: "string" }, bedrooms: { type: "number" },
        bathrooms: { type: "number" }, hourly_rate: { type: "number" },
        preferred_date: { type: "string" }, preferred_time: { type: "string" },
        notes: { type: "string" }
      },
      required: []
    }
  },
  {
    name: "check_availability",
    description: "Check cleaner availability for a specific date. Returns available time slots.",
    input_schema: { type: "object", properties: { date: { type: "string" } }, required: ["date"] }
  },
  {
    name: "create_booking",
    description: "Create a PENDING booking after the client confirms the recap.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string" }, time: { type: "string" },
        service_type: { type: "string" }, hourly_rate: { type: "number" }
      },
      required: ["date", "time", "service_type", "hourly_rate"]
    }
  }
];

const RETURNING_TOOLS = TOOLS.filter(t => t.name !== "create_client");

// --- Mock tool responses ---
function mockToolResult(toolName, input) {
  switch (toolName) {
    case "create_client":
      console.log(`    📋 [TOOL] create_client → name: "${input.name}"`);
      return { success: true };
    case "save_info":
      const fields = Object.entries(input).filter(([,v]) => v !== undefined && v !== null && v !== "");
      console.log(`    💾 [TOOL] save_info → ${fields.map(([k,v]) => `${k}: "${v}"`).join(", ")}`);
      return { success: true };
    case "check_availability": {
      console.log(`    📅 [TOOL] check_availability → date: ${input.date}`);
      // Mock: return some available times
      const day = new Date(input.date + "T12:00:00");
      const dayName = day.toLocaleDateString("en-US", { weekday: "short" });
      if (dayName === "Sun") {
        return { available: false, message: "Nothing open on Sunday. Suggest a different day." };
      }
      const now = new Date();
      const today = now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
      if (input.date === today) {
        return { sameDay: true, message: "Same-day = $100/hr emergency rate." };
      }
      return { available: true, open_times: ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM"], message: "Share 2-3 of these times. Do NOT list all of them." };
    }
    case "create_booking":
      console.log(`    🎉 [TOOL] create_booking → ${input.date} @ ${input.time}, ${input.service_type}, $${input.hourly_rate}/hr`);
      return { success: true, bookingId: "mock-booking-id" };
    default:
      return { error: "Unknown tool" };
  }
}

// --- Build calendar context ---
function buildCalendarContext() {
  const now = new Date();
  const fullDate = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    const dayStr = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "America/New_York" });
    const iso = d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    days.push(`${dayStr} = ${iso}`);
  }
  return `\n\nToday is ${fullDate}.\nUPCOMING CALENDAR (use this to resolve dates):\n${days.join("\n")}\nWhen they say "this Wednesday" or "next Thursday", look up the date here. NEVER guess dates.`;
}

// --- Main loop ---
async function main() {
  const tools = existingClientName ? RETURNING_TOOLS : TOOLS;

  let systemPrompt = SYSTEM_PROMPT + buildCalendarContext();
  if (existingClientName) {
    const firstName = existingClientName.split(" ")[0];
    systemPrompt += `\n\nCLIENT INFO: This is ${existingClientName} — they're already in the system. You already know their name (you greeted them as ${firstName}). Do NOT ask for their name. Skip straight to asking what they need — what kind of cleaning, scheduling, etc.`;
  }

  const transcript = [];
  const savedData = {};

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise(resolve => rl.question(q, resolve));

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║           SELENAS TEST CONSOLE                   ║");
  console.log("║  No DB writes. All tools are mocked.             ║");
  console.log("║  Type as a prospect. Ctrl+C to quit.             ║");
  if (existingClientName) {
    console.log(`║  Mode: EXISTING CLIENT (${existingClientName})`);
  } else {
    console.log("║  Mode: NEW PROSPECT");
  }
  console.log("╚══════════════════════════════════════════════════╝");

  // Simulate the hardcoded greeting
  const greeting = existingClientName
    ? `Hola ${existingClientName.split(" ")[0]}, Happy to hear from you again. How are you?`
    : "Hola, Thank You for reaching out. How are you?";
  console.log(`\n  SELENAS: ${greeting}\n`);
  transcript.push({ role: "assistant", content: greeting });

  while (true) {
    const userMsg = await ask("  YOU: ");
    if (!userMsg.trim()) continue;

    transcript.push({ role: "user", content: userMsg });

    // Build messages (same logic as selenas.ts)
    const messages = [];
    const recent = transcript.slice(-10);
    for (const msg of recent) {
      if (messages.length > 0 && messages[messages.length - 1].role === msg.role) {
        messages[messages.length - 1].content += "\n" + msg.content;
        continue;
      }
      messages.push({ role: msg.role, content: msg.content });
    }
    if (messages.length > 0 && messages[0].role === "assistant") {
      messages.shift();
    }

    // Tool loop (max 5 iterations, same as production)
    let currentMessages = [...messages];
    let finalText = "";

    for (let i = 0; i < 5; i++) {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 700,
        system: systemPrompt,
        messages: currentMessages,
        tools,
      });

      const toolBlocks = response.content.filter(b => b.type === "tool_use");
      const textBlocks = response.content.filter(b => b.type === "text");

      if (toolBlocks.length === 0) {
        if (textBlocks.length > 0) {
          finalText = textBlocks.map(b => b.text).join(" ").trim();
        }
        break;
      }

      // Process tools
      currentMessages.push({ role: "assistant", content: response.content });
      const toolResults = [];

      for (const tool of toolBlocks) {
        const result = mockToolResult(tool.name, tool.input);
        // Track saved data
        if (tool.name === "save_info") Object.assign(savedData, tool.input);
        if (tool.name === "create_client") savedData.name = tool.input.name;
        toolResults.push({ type: "tool_result", tool_use_id: tool.id, content: JSON.stringify(result) });
      }

      currentMessages.push({ role: "user", content: toolResults });

      if (response.stop_reason === "end_turn" && textBlocks.length > 0) {
        finalText = textBlocks.map(b => b.text).join(" ").trim();
        break;
      }
    }

    if (!finalText) {
      console.log("\n  SELENAS: (no response)\n");
    } else {
      if (finalText.length > 600) finalText = finalText.slice(0, 597) + "...";
      console.log(`\n  SELENAS: ${finalText}\n`);
      transcript.push({ role: "assistant", content: finalText });
    }

    // Show collected data so far
    const dataKeys = Object.keys(savedData);
    if (dataKeys.length > 0) {
      console.log("  ─── Collected so far ───");
      for (const [k, v] of Object.entries(savedData)) {
        if (v !== undefined && v !== null && v !== "") console.log(`    ${k}: ${v}`);
      }
      console.log("  ────────────────────────\n");
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
