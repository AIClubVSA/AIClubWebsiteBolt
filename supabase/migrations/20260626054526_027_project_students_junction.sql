-- Create junction table for project-student many-to-many relationship
CREATE TABLE public.project_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, student_id)
);

-- Enable RLS
ALTER TABLE public.project_students ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_students
CREATE POLICY "select_own_project_students" ON public.project_students FOR SELECT
  TO authenticated USING (
    student_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "insert_project_students" ON public.project_students FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "delete_project_students" ON public.project_students FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Migrate existing data from projects.student_id to project_students
INSERT INTO public.project_students (project_id, student_id)
SELECT id, student_id FROM public.projects WHERE student_id IS NOT NULL;

-- Make student_id nullable since we now use junction table
ALTER TABLE public.projects ALTER COLUMN student_id DROP NOT NULL;

-- Create index for faster lookups
CREATE INDEX idx_project_students_project ON public.project_students(project_id);
CREATE INDEX idx_project_students_student ON public.project_students(student_id);