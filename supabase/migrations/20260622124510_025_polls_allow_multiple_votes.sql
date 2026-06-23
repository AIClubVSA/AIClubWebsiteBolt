-- Add allow_multiple_votes setting to polls
ALTER TABLE polls ADD COLUMN allow_multiple_votes boolean NOT NULL DEFAULT false;

-- Drop the unique constraint so multiple votes per student are possible when allowed
ALTER TABLE poll_votes DROP CONSTRAINT IF EXISTS poll_votes_poll_id_student_id_key;
