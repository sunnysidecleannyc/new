-- Add status column to clients table
-- 'active' = full client (form completed), 'potential' = chatbot prospect (name only)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Existing clients are all active
UPDATE clients SET status = 'active' WHERE status IS NULL;
