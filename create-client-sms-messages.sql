-- Client SMS Transcript table
-- Stores every SMS interaction per client (separate from notes)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS client_sms_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_sms_client_created
  ON client_sms_messages(client_id, created_at);

-- RLS
ALTER TABLE client_sms_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_sms_messages' AND policyname = 'Service role full access on client_sms_messages'
  ) THEN
    CREATE POLICY "Service role full access on client_sms_messages"
      ON client_sms_messages FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
