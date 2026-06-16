-- Add email format check constraint to newsletter_signups
ALTER TABLE newsletter_signups
  ADD CONSTRAINT newsletter_signups_email_format
  CHECK (email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$');

-- Replace the always-true RLS policy with one that validates email format
DROP POLICY IF EXISTS "anon_insert_newsletter" ON newsletter_signups;

CREATE POLICY "anon_insert_newsletter" ON newsletter_signups FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
  );
