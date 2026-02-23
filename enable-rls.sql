-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Service role key bypasses RLS automatically
-- =====================================================
-- IMPORTANT: Deploy code changes FIRST, then run this script.
-- The deployed code uses supabaseAdmin (service role) which bypasses RLS.

-- =====================================================
-- STEP 1: Enable RLS on every public table
-- =====================================================

ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrers ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: SELECT-only policies for anon where needed
-- (Public forms need to check for duplicates / look up referrers)
-- Everything else: NO anon access at all.
-- =====================================================

-- Clients: anon can check if phone/email exists (duplicate check)
CREATE POLICY "anon_select_clients" ON clients
  FOR SELECT TO anon USING (true);

-- Bookings: anon can read (client dashboard needs to see their bookings)
CREATE POLICY "anon_select_bookings" ON bookings
  FOR SELECT TO anon USING (true);

-- Referrers: anon can look up referral codes
CREATE POLICY "anon_select_referrers" ON referrers
  FOR SELECT TO anon USING (true);

-- Lead clicks: anon can read for attribution
CREATE POLICY "anon_select_lead_clicks" ON lead_clicks
  FOR SELECT TO anon USING (true);

-- Cleaners: anon can read (client-side dashboard page reads directly)
CREATE POLICY "anon_select_cleaners" ON cleaners
  FOR SELECT TO anon USING (true);

-- Cleaner applications: anon can INSERT (public apply form)
CREATE POLICY "anon_insert_cleaner_applications" ON cleaner_applications
  FOR INSERT TO anon WITH CHECK (true);

-- Feedback: anon can INSERT (public feedback form)
CREATE POLICY "anon_insert_feedback" ON feedback
  FOR INSERT TO anon WITH CHECK (true);

-- Availability: anon can read (client booking form checks availability)
CREATE POLICY "anon_select_availability" ON availability
  FOR SELECT TO anon USING (true);

-- Schedules: anon can read (booking form checks cleaner schedules)
CREATE POLICY "anon_select_schedules" ON schedules
  FOR SELECT TO anon USING (true);

-- ALL OTHER TABLES: No anon access at all
-- bank_statements, domain_notes, email_logs, error_logs, expenses,
-- invoices, notifications, payments, push_subscriptions,
-- referral_commissions, settings, team_members, verification_codes
-- → Only accessible via service_role (supabaseAdmin in API routes)

-- =====================================================
-- STEP 3: Delete spam clients (inserted 2026-02-12 22:20 via direct REST API)
-- =====================================================
DELETE FROM clients WHERE id IN (
  'a5fad89a-cf97-4d21-82eb-59209916fd31',  -- Sean Thomas
  '59403971-1b43-4df3-8400-a83bbb97ce97',  -- Michael Harrison
  'a6b032b7-87d8-42e9-91e2-cf1cdb613a52',  -- Maggie
  '97ff0417-e2d5-4517-82a4-88e1c95d5af8'   -- Connor Wright
);

-- =====================================================
-- VERIFY: All tables should show rowsecurity = true
-- =====================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
