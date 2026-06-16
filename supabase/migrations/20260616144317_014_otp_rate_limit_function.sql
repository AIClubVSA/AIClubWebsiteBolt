/*
# Add OTP Rate Limit Increment Function

## Summary
Adds a Postgres function `increment_otp_attempts` used by the OTP edge function
to atomically upsert a rate-limit counter for a given email + time window.
Returns the current attempt count so the caller can decide whether to allow the request.

## New Functions
- `increment_otp_attempts(p_email text, p_window_start timestamptz) RETURNS integer`
  - Inserts a new row with attempts=1, or increments attempts on conflict.
  - Returns the new attempt count.
  - SECURITY DEFINER so it runs as the table owner, not the calling role.
  - search_path locked to public, pg_temp to prevent search-path injection.

## Security
- REVOKE EXECUTE from PUBLIC, anon, authenticated — only the service-role
  edge function (which bypasses RLS) should call this.

## Notes
1. The function is safe to call concurrently — ON CONFLICT DO UPDATE is atomic.
2. Old rate-limit windows are not automatically purged here; a periodic cleanup
   can be added later or handled via a scheduled job.
*/

CREATE OR REPLACE FUNCTION public.increment_otp_attempts(
  p_email text,
  p_window_start timestamptz
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_attempts integer;
BEGIN
  INSERT INTO public.otp_rate_limits (email, window_start, attempts)
  VALUES (p_email, p_window_start, 1)
  ON CONFLICT (email, window_start)
  DO UPDATE SET attempts = otp_rate_limits.attempts + 1
  RETURNING attempts INTO v_attempts;

  RETURN v_attempts;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_otp_attempts(text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_otp_attempts(text, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.increment_otp_attempts(text, timestamptz) FROM authenticated;
