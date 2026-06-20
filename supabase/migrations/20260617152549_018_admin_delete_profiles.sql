-- Allow admins to delete student profiles
CREATE POLICY "admin_delete_profiles" ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
