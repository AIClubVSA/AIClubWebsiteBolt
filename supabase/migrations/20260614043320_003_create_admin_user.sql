-- Create admin user in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
SELECT 
  '00000000-0000-0000-0000-000000000000',
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'::uuid,
  'authenticated',
  'authenticated',
  'aiclub.heads.vsa@gmail.com',
  crypt('aicentreadmin', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"AI Centre Admin"}',
  false,
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'aiclub.heads.vsa@gmail.com'
);

-- Create profile with admin role
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'::uuid,
  'aiclub.heads.vsa@gmail.com',
  'AI Centre Admin',
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'aiclub.heads.vsa@gmail.com'
);