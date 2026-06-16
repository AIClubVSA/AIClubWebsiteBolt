-- Create identity for the user in auth.identities
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  created_at,
  updated_at
)
SELECT 
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'::uuid,
  'aiclub.heads.vsa@gmail.com',
  'email',
  jsonb_build_object(
    'sub', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    'email', 'aiclub.heads.vsa@gmail.com'
  ),
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities WHERE user_id = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'::uuid
);