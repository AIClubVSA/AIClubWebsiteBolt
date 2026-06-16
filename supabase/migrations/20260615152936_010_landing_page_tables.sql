/*
# Create Landing Page Tables

1. New Tables
   - `events` - AI Club events (workshops, talks, hackathons)
     - id, title, event_date, event_time, event_type, description, is_featured
   - `testimonials` - Success stories from members
     - id, name, role, content, avatar_url, is_featured
   - `newsletter_signups` - Email signups for the newsletter
     - id, email, created_at

2. Security
   - RLS enabled on all tables
   - Events/testimonials: public read for anon/authenticated
   - Newsletter signups: public insert only (no read)
*/

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_date date NOT NULL,
  event_time text,
  event_type text NOT NULL DEFAULT 'Workshop',
  description text,
  is_featured boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  content text NOT NULL,
  avatar_url text,
  is_featured boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Newsletter signups table
CREATE TABLE IF NOT EXISTS newsletter_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_signups ENABLE ROW LEVEL SECURITY;

-- Events policies (public read)
DROP POLICY IF EXISTS "anon_read_events" ON events;
CREATE POLICY "anon_read_events" ON events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_manage_events" ON events;
CREATE POLICY "authenticated_manage_events" ON events FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Testimonials policies (public read)
DROP POLICY IF EXISTS "anon_read_testimonials" ON testimonials;
CREATE POLICY "anon_read_testimonials" ON testimonials FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_manage_testimonials" ON testimonials;
CREATE POLICY "authenticated_manage_testimonials" ON testimonials FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Newsletter signups policies (public insert only, no read)
DROP POLICY IF EXISTS "anon_insert_newsletter" ON newsletter_signups;
CREATE POLICY "anon_insert_newsletter" ON newsletter_signups FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Insert sample events
INSERT INTO events (title, event_date, event_time, event_type, description) VALUES
('Introduction to Neural Networks', '2026-07-15', '10:00 AM', 'Workshop', 'Learn the fundamentals of neural networks and build your first model from scratch.'),
('AI Ethics & Responsibility', '2026-07-22', '2:00 PM', 'Talk', 'Exploring the ethical implications of AI in modern society with industry experts.'),
('AI Hackathon 2026', '2026-08-05', '9:00 AM', 'Hackathon', '24-hour hackathon to build innovative AI solutions for real-world problems.')
ON CONFLICT DO NOTHING;

-- Insert sample testimonials
INSERT INTO testimonials (name, role, content, avatar_url) VALUES
('Sarah Chen', 'ML Engineer at Google', 'The AI Club gave me hands-on experience that landed me my dream job. The projects and mentorship were invaluable.', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=100&h=100&fit=crop'),
('Marcus Johnson', 'AI Researcher at OpenAI', 'I started here as a complete beginner. Now I am publishing papers. This community changed my career trajectory.', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=100&h=100&fit=crop'),
('Priya Patel', 'Data Scientist at Microsoft', 'The collaborative environment and real-world projects helped me build a portfolio that stood out to recruiters.', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=100&h=100&fit=crop')
ON CONFLICT DO NOTHING;