-- Polls table
CREATE TABLE polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Poll options table
CREATE TABLE poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Poll votes table (one vote per student per poll)
CREATE TABLE poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, student_id)
);

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls RLS: anyone authenticated can read; only admins can write
CREATE POLICY "select_polls" ON polls FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_polls" ON polls FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "update_polls" ON polls FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "delete_polls" ON polls FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Poll options RLS
CREATE POLICY "select_poll_options" ON poll_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_poll_options" ON poll_options FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "update_poll_options" ON poll_options FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "delete_poll_options" ON poll_options FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Poll votes RLS: students can insert/select own; admins can see all; nobody updates
CREATE POLICY "select_poll_votes" ON poll_votes FOR SELECT TO authenticated USING (
  auth.uid() = student_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "insert_poll_votes" ON poll_votes FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = student_id
);
CREATE POLICY "update_poll_votes" ON poll_votes FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "delete_poll_votes" ON poll_votes FOR DELETE TO authenticated USING (
  auth.uid() = student_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
