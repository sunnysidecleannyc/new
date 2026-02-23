import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Supabase ──────────────────────────────────────────────────────────

let mockSupabase: any

vi.mock('@/lib/supabase', () => ({
  get supabaseAdmin() {
    return mockSupabase
  },
}))

// ─── Mock sms-chatbot ───────────────────────────────────────────────────────

const mockHandleChatbot = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/sms-chatbot', () => ({
  handleChatbotMessage: (...args: any[]) => mockHandleChatbot(...args),
}))

// ─── Import under test ─────────────────────────────────────────────────────

import { POST } from '@/app/api/webhook/telnyx/route'

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(event: any): Request {
  return new Request('https://example.com/api/webhook/telnyx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: event }),
  })
}

function inboundEvent(text: string, from = '+12125551234') {
  return {
    event_type: 'message.received',
    payload: {
      from: { phone_number: from },
      text,
    },
  }
}

function setupMockSupabase() {
  let currentTable = ''

  mockSupabase = {
    from: vi.fn((table: string) => {
      currentTable = table
      return mockSupabase
    }),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    neq: vi.fn(() => mockSupabase),
    ilike: vi.fn(() => mockSupabase),
    is: vi.fn(() => mockSupabase),
    in: vi.fn(() => mockSupabase),
    limit: vi.fn(() => mockSupabase),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: vi.fn((resolve: any, reject?: any) => {
      return Promise.resolve({ data: [], error: null }).then(resolve, reject)
    }),
  }
}

// ─── Reset ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockHandleChatbot.mockResolvedValue(undefined)
  setupMockSupabase()
})

// ═══════════════════════════════════════════════════════════════════════════

describe('Telnyx webhook POST', () => {
  it('STOP → revokes consent for clients + cleaners, expires conversations', async () => {
    const req = makeRequest(inboundEvent('STOP'))
    const res = await POST(req)
    expect(res.status).toBe(200)

    // Should update clients, cleaners, and sms_conversations
    const fromCalls = mockSupabase.from.mock.calls.map((c: any) => c[0])
    expect(fromCalls).toContain('clients')
    expect(fromCalls).toContain('cleaners')
    expect(fromCalls).toContain('sms_conversations')

    // Should NOT route to chatbot
    expect(mockHandleChatbot).not.toHaveBeenCalled()
  })

  it('UNSUBSCRIBE → same as STOP', async () => {
    const req = makeRequest(inboundEvent('UNSUBSCRIBE'))
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockHandleChatbot).not.toHaveBeenCalled()
    const fromCalls = mockSupabase.from.mock.calls.map((c: any) => c[0])
    expect(fromCalls).toContain('clients')
    expect(fromCalls).toContain('cleaners')
  })

  it('CANCEL does NOT revoke consent — routes to chatbot', async () => {
    // CANCEL is a booking intent, not a TCPA opt-out
    const req = makeRequest(inboundEvent('CANCEL'))
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockHandleChatbot).toHaveBeenCalled()
  })

  it('START → re-enables consent', async () => {
    const req = makeRequest(inboundEvent('START'))
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockSupabase.update).toHaveBeenCalled()
    expect(mockHandleChatbot).not.toHaveBeenCalled()
  })

  it('empty text → ignored', async () => {
    const req = makeRequest({
      event_type: 'message.received',
      payload: { from: { phone_number: '+12125559999' }, text: '' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockHandleChatbot).not.toHaveBeenCalled()
  })

  it('all inbound messages route through handleChatbotMessage', async () => {
    const req = makeRequest(inboundEvent('hello', '+19175550001'))
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockHandleChatbot).toHaveBeenCalledWith('+19175550001', 'hello')
  })

  it('delivery status update → updates sms_logs', async () => {
    const req = makeRequest({
      event_type: 'message.delivered',
      payload: { id: 'msg-123' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const fromCalls = mockSupabase.from.mock.calls.map((c: any) => c[0])
    expect(fromCalls).toContain('sms_logs')
  })

  it('no event_type → returns ok', async () => {
    const req = makeRequest({})
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('chatbot error → creates notification fallback', async () => {
    mockHandleChatbot.mockRejectedValue(new Error('chatbot crash'))
    const req = makeRequest(inboundEvent('Hi there', '+19175550003'))
    const res = await POST(req)
    expect(res.status).toBe(200)
    // Should insert notification about the error
    const fromCalls = mockSupabase.from.mock.calls.map((c: any) => c[0])
    expect(fromCalls).toContain('notifications')
  })
})
