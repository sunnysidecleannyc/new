CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  business_name TEXT NOT NULL DEFAULT 'The NYC Maid',
  business_phone TEXT NOT NULL DEFAULT '(212) 202-8400',
  business_email TEXT NOT NULL DEFAULT 'hi@thenycmaid.com',
  business_website TEXT NOT NULL DEFAULT 'https://nycmaid.nyc',
  admin_email TEXT NOT NULL DEFAULT 'jeff@thenycmaid.com',
  email_from_name TEXT NOT NULL DEFAULT 'The NYC Maid',
  email_from_address TEXT NOT NULL DEFAULT 'hello@nycmaid.nyc',
  service_types JSONB NOT NULL DEFAULT '[{"name":"Standard Cleaning","default_hours":2,"active":true},{"name":"Deep Cleaning","default_hours":4,"active":true},{"name":"Move In/Out","default_hours":5,"active":true},{"name":"Post Construction","default_hours":2,"active":true}]',
  standard_rate INTEGER NOT NULL DEFAULT 75,
  budget_rate INTEGER NOT NULL DEFAULT 49,
  payment_methods JSONB NOT NULL DEFAULT '["zelle","apple_pay"]',
  business_hours_start INTEGER NOT NULL DEFAULT 9,
  business_hours_end INTEGER NOT NULL DEFAULT 16,
  booking_buffer_minutes INTEGER NOT NULL DEFAULT 90,
  default_duration_hours INTEGER NOT NULL DEFAULT 2,
  min_days_ahead INTEGER NOT NULL DEFAULT 1,
  allow_same_day BOOLEAN NOT NULL DEFAULT FALSE,
  commission_rate INTEGER NOT NULL DEFAULT 10,
  attribution_window_hours INTEGER NOT NULL DEFAULT 48,
  active_client_threshold_days INTEGER NOT NULL DEFAULT 45,
  at_risk_threshold_days INTEGER NOT NULL DEFAULT 90,
  reschedule_notice_recurring_days INTEGER NOT NULL DEFAULT 7,
  reschedule_notice_onetime_hours INTEGER NOT NULL DEFAULT 48,
  reminder_days JSONB NOT NULL DEFAULT '[7,3,1]',
  reminder_hours_before INTEGER NOT NULL DEFAULT 2,
  daily_summary_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX settings_singleton ON settings ((true));

INSERT INTO settings DEFAULT VALUES;
