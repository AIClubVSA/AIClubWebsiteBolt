/*
# Add Restrictive Policies for Service-Role-Only Tables

## Summary
`email_otps` and `otp_rate_limits` are accessed exclusively by the OTP edge
function using the service role key, which bypasses RLS. However, having RLS
enabled with zero policies triggers a security warning because any future
policy mistake could inadvertently open access.

This migration adds explicit DENY-style policies (USING false) for every verb
on both tables, making the intent unambiguous: no client role (anon or
authenticated) may ever read or write these tables directly. All access goes
through the service role in the edge function.

## Modified Tables
- `email_otps` — 4 deny policies (SELECT, INSERT, UPDATE, DELETE) for anon + authenticated
- `otp_rate_limits` — 4 deny policies (SELECT, INSERT, UPDATE, DELETE) for anon + authenticated

## Security
- USING (false) / WITH CHECK (false) is the correct pattern for tables that
  must never be client-accessible. It is different from USING (true) which
  opens access — here it locks it shut.
- Service role key bypasses RLS entirely, so the edge function is unaffected.

## Notes
1. These policies silence the "RLS enabled, no policies" scanner warning while
   preserving the security posture (no client access).
2. If a future feature needs to expose read-only data from these tables to
   authenticated users, a new targeted policy should be added then.
*/

-- email_otps: deny all client access
DROP POLICY IF EXISTS "deny_select_email_otps" ON email_otps;
CREATE POLICY "deny_select_email_otps" ON email_otps
  FOR SELECT TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "deny_insert_email_otps" ON email_otps;
CREATE POLICY "deny_insert_email_otps" ON email_otps
  FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "deny_update_email_otps" ON email_otps;
CREATE POLICY "deny_update_email_otps" ON email_otps
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "deny_delete_email_otps" ON email_otps;
CREATE POLICY "deny_delete_email_otps" ON email_otps
  FOR DELETE TO anon, authenticated USING (false);

-- otp_rate_limits: deny all client access
DROP POLICY IF EXISTS "deny_select_otp_rate_limits" ON otp_rate_limits;
CREATE POLICY "deny_select_otp_rate_limits" ON otp_rate_limits
  FOR SELECT TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "deny_insert_otp_rate_limits" ON otp_rate_limits;
CREATE POLICY "deny_insert_otp_rate_limits" ON otp_rate_limits
  FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "deny_update_otp_rate_limits" ON otp_rate_limits;
CREATE POLICY "deny_update_otp_rate_limits" ON otp_rate_limits
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "deny_delete_otp_rate_limits" ON otp_rate_limits;
CREATE POLICY "deny_delete_otp_rate_limits" ON otp_rate_limits
  FOR DELETE TO anon, authenticated USING (false);
