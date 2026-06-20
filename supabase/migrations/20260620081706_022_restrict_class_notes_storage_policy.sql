/*
# Restrict class-notes storage SELECT policy

The broad public SELECT policy on storage.objects for the class-notes bucket
allowed any anonymous client to list all files in the bucket. Since the bucket
is public, direct object URL access works without any SELECT policy at all.

Changes:
- Drop the overly-broad `public_read_class_notes` SELECT policy
- Add a narrower SELECT policy that allows only authenticated users to list/read objects
  (unauthenticated clients can still access files via their public URLs, but cannot
  enumerate the bucket contents)
*/

DROP POLICY IF EXISTS "public_read_class_notes" ON storage.objects;

CREATE POLICY "authenticated_read_class_notes" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'class-notes');
