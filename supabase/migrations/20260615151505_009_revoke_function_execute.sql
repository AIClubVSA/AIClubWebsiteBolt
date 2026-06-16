/*
# Revoke Execute Permissions on Security Definer Functions

1. Security Changes
   - Revoke ALL (including EXECUTE) permissions on `update_updated_at()` from PUBLIC, anon, and authenticated roles
   - Revoke ALL (including EXECUTE) permissions on `handle_new_user()` from PUBLIC, anon, and authenticated roles
   
2. Reasoning
   These functions are SECURITY DEFINER and should NOT be callable via the REST API (`/rest/v1/rpc/...`).
   They are only intended to run as triggers internally:
   - `update_updated_at()` is called by UPDATE triggers on tables
   - `handle_new_user()` is called by the trigger on auth.users after signup
   
   Revoking PUBLIC ensures no roles inherit execute permissions by default.
   Revoking anon/authenticated prevents REST API access.
   The triggers still work because they execute as the database superuser.
*/

-- Revoke all permissions from update_updated_at function
REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM authenticated;

-- Revoke all permissions from handle_new_user function
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;