-- Fix search_path security issues and revoke direct execution

-- Fix update_updated_at function with secure search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Fix handle_new_user function with secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Revoke execute permissions from anon and authenticated roles
-- This function should only be called by the trigger, not directly via REST API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- Only allow the function to be called internally (by the trigger)
-- The trigger runs as the database superuser, so it doesn't need explicit permissions