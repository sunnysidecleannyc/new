-- SMS Logs table (mirrors email_logs)
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  sms_type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  telnyx_message_id TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for dedup and lookups
CREATE INDEX IF NOT EXISTS idx_sms_logs_booking_type ON sms_logs(booking_id, sms_type);
CREATE INDEX IF NOT EXISTS idx_sms_logs_telnyx_id ON sms_logs(telnyx_message_id);

-- Add sms_consent to clients (default true = opt-out model)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN DEFAULT true;

-- Add sms_consent to cleaners (default true = opt-out model)
ALTER TABLE cleaners ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN DEFAULT true;

-- RLS: sms_logs should be accessible by service role only
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on sms_logs"
  ON sms_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);
