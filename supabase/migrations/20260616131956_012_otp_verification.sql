/*
# OTP Verification Table

## Summary
Adds a table to store 6-digit one-time passwords used to verify email addresses
during sign-in and sign-up. Each OTP is tied to an email address, expires after
10 minutes, and is single-use (consumed on successful verification).

## New Tables
- `email_otps`
  - `id` (uuid, primary key)
  - `email` (text, not null) — the address the OTP was sent to
  - `code` (text, not null) — 6-digit code
  - `purpose` (text, not null) — 'signin' or 'signup'
  - `expires_at` (timestamptz, not null) — 10 minutes from creation
  - `used` (boolean, default false) — consumed after successful verification
  - `created_at` (timestamptz)

## Security
- RLS enabled.
- Anon/authenticated can INSERT (edge function inserts via service role, but
  this also allows the client to request an OTP through the edge function).
- No SELECT policy for anon — codes are never readable from the client.
- Service role (used by the edge function) bypasses RLS so it can verify codes.
- Expired or used OTPs are cleaned up automatically by the edge function.

## Notes
1. The edge function uses the service role key to insert and verify OTPs.
2. Codes older than 10 minutes are rejected regardless of `used` flag.
3. Max 1 active (unused, unexpired) OTP per email at a time — older ones are
   overwritten on each new request.
*/

CREATE TABLE IF NOT EXISTS email_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('signin', 'signup')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_otps_email_idx ON email_otps (email);
CREATE INDEX IF NOT EXISTS email_otps_expires_at_idx ON email_otps (expires_at);

ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

-- No client-side read access — codes are verified server-side only
DROP POLICY IF EXISTS "no_select_otps" ON email_otps;

-- Allow inserts only via service role (edge function); deny direct client inserts
-- by not creating an INSERT policy for anon/authenticated.
-- Service role bypasses RLS entirely.
