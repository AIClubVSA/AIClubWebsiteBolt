/*
# Fix FOR ALL Policies + Add OTP Rate Limiting

## Summary
1. Replaces `FOR ALL` policies on `events` and `testimonials` with explicit
   per-verb policies (SELECT, INSERT, UPDATE, DELETE) as required by RLS best
   practices. `FOR ALL` policies combine USING and WITH CHECK in ways that can
   produce unexpected behavior across operations.

2. Adds an `otp_rate_limits` table to enforce a maximum of 5 OTP send requests
   per email address per 15-minute window, preventing OTP spam and enumeration.

## Modified Tables
- `events` — replaced `authenticated_manage_events FOR ALL` with 3 separate
  admin-only policies (INSERT, UPDATE, DELETE). SELECT stays public.
- `testimonials` — same split as events.

## New Tables
- `otp_rate_limits`
  - `id` (uuid, primary key)
  - `email` (text, not null)
  - `window_start` (timestamptz) — start of the 15-minute window
  - `attempts` (int, default 1) — count of OTP requests in the window
  - `created_at` (timestamptz)

## Security
- RLS enabled on `otp_rate_limits`; no client policies (service role only).
- Unique constraint on (email, window_start) so upsert works atomically.
- Indexes on email and window_start for fast lookups.

## Notes
1. FOR ALL with USING+WITH CHECK differs subtly per operation; explicit policies
   are unambiguous and easier to audit.
2. Rate limit window is 15 minutes, max 5 attempts per window per email.
*/

-- Fix events policies: drop FOR ALL, create explicit verb policies
DROP POLICY IF EXISTS "authenticated_manage_events" ON events;

DROP POLICY IF EXISTS "admin_insert_events" ON events;
CREATE POLICY "admin_insert_events" ON events FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS "admin_update_events" ON events;
CREATE POLICY "admin_update_events" ON events FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS "admin_delete_events" ON events;
CREATE POLICY "admin_delete_events" ON events FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Fix testimonials policies: drop FOR ALL, create explicit verb policies
DROP POLICY IF EXISTS "authenticated_manage_testimonials" ON testimonials;

DROP POLICY IF EXISTS "admin_insert_testimonials" ON testimonials;
CREATE POLICY "admin_insert_testimonials" ON testimonials FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS "admin_update_testimonials" ON testimonials;
CREATE POLICY "admin_update_testimonials" ON testimonials FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS "admin_delete_testimonials" ON testimonials;
CREATE POLICY "admin_delete_testimonials" ON testimonials FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- OTP rate limiting table
CREATE TABLE IF NOT EXISTS otp_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT otp_rate_limits_email_window_key UNIQUE (email, window_start)
);

CREATE INDEX IF NOT EXISTS otp_rate_limits_email_idx ON otp_rate_limits (email);
CREATE INDEX IF NOT EXISTS otp_rate_limits_window_idx ON otp_rate_limits (window_start);

ALTER TABLE otp_rate_limits ENABLE ROW LEVEL SECURITY;
-- No client policies: only the service-role edge function reads/writes this table
