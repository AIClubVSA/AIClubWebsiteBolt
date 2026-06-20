-- Class notes files table: admin-uploaded files (images, documents, slides) per class
CREATE TABLE IF NOT EXISTS class_notes_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE class_notes_files ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read class note files
CREATE POLICY "select_class_notes_files" ON class_notes_files FOR SELECT
  TO authenticated USING (true);

-- Only admins can upload/delete
CREATE POLICY "insert_admin_class_notes_files" ON class_notes_files FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "delete_admin_class_notes_files" ON class_notes_files FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "update_admin_class_notes_files" ON class_notes_files FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Index for fast per-class lookups
CREATE INDEX IF NOT EXISTS idx_class_notes_files_class ON class_notes_files(class_id);

-- Create the storage bucket for class notes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'class-notes',
  'class-notes',
  true,
  52428800,  -- 50 MB per file
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: public read, admin upload/delete
CREATE POLICY "public_read_class_notes" ON storage.objects FOR SELECT
  USING (bucket_id = 'class-notes');

CREATE POLICY "admin_upload_class_notes" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'class-notes'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admin_delete_class_notes" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'class-notes'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );