-- SMS Chatbot tables for inbound lead automation
-- Run this in Supabase SQL Editor

-- Conversation state machine
CREATE TABLE IF NOT EXISTS sms_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'welcome',
  name TEXT,
  email TEXT,
  address TEXT,
  service_type TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  pricing_choice TEXT,
  hourly_rate INTEGER,
  preferred_date TEXT,
  preferred_time TEXT,
  booking_id UUID,
  client_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expired BOOLEAN DEFAULT false
);

-- Only one active conversation per phone number
CREATE UNIQUE INDEX IF NOT EXISTS idx_sms_conv_active_phone
  ON sms_conversations(phone) WHERE completed_at IS NULL AND expired = false;

-- Full transcript (every message in and out)
CREATE TABLE IF NOT EXISTS sms_conversation_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES sms_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,  -- 'inbound' or 'outbound'
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_conv_msgs
  ON sms_conversation_messages(conversation_id, created_at);

-- RLS policies (service role full access)
ALTER TABLE sms_conversations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sms_conversations' AND policyname = 'Service role full access on sms_conversations'
  ) THEN
    CREATE POLICY "Service role full access on sms_conversations"
      ON sms_conversations FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE sms_conversation_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sms_conversation_messages' AND policyname = 'Service role full access on sms_conversation_messages'
  ) THEN
    CREATE POLICY "Service role full access on sms_conversation_messages"
      ON sms_conversation_messages FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
