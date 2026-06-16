-- Drop the existing insert and delete policies for projects
DROP POLICY IF EXISTS "insert_projects" ON projects;
DROP POLICY IF EXISTS "delete_projects" ON projects;

-- Create new policies that only allow admins to insert and delete projects
CREATE POLICY "insert_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "delete_projects" ON projects FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Update the insert policy for profiles - remove trigger for first user admin
-- and require email confirmation
DROP TRIGGER IF EXISTS promote_first_user ON profiles;
DROP FUNCTION IF EXISTS promote_first_user_to_admin();