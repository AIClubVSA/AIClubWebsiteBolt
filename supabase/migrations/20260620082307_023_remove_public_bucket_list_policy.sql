-- Remove the broad SELECT policy that allows listing all files
-- Public buckets don't need SELECT policies for public URL access
-- This policy only enabled file listing, which exposes more data than intended
DROP POLICY IF EXISTS authenticated_read_class_notes ON storage.objects;