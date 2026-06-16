-- Let's verify by querying the user - this is just for verification
-- First, let me check if the user exists in profiles
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles WHERE email = 'aiclub.heads.vsa@gmail.com';
  RAISE NOTICE 'Admin user count: %', user_count;
END $$;