/*
# Disable handle_new_user Trigger for OTP-Verified Signups

## Summary
The `handle_new_user` trigger auto-creates a profile on every auth.users INSERT.
With the OTP flow, `signUp()` in AuthContext manually inserts the profile AFTER
OTP verification — making the trigger redundant and causing a duplicate-key error
(both the trigger and the manual insert try to write the same profile id).

This migration drops the trigger. Profile creation is now exclusively owned by
the OTP-verified signup path in the edge function / AuthContext.

The `handle_new_user` function is kept in place (it is harmless without the
trigger) so dependent revoke migrations remain valid.

## Modified
- Drops trigger `on_auth_user_created` on `auth.users`.

## Notes
1. The admin account created via migration already has a profile row — no data loss.
2. Any future automated profile creation should go through the OTP-verified path.
*/

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
