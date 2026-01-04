-- Migration 018b: Owner-only policies for storage.objects
-- THESE STATEMENTS REQUIRE THE DATABASE OWNER ROLE
-- Run this file from the Supabase SQL Editor (or with a DB owner connection).

-- DROP existing policies (safe to run)
DROP POLICY IF EXISTS "Public access to directory-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload to directory-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete from directory-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update directory-images" ON storage.objects;

-- Policy for reading images (public)
CREATE POLICY "Public access to directory-images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'directory-images');

-- Policy for uploading (admins only)
CREATE POLICY "Admin can upload to directory-images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'directory-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policy for delete (admins only)
CREATE POLICY "Admin can delete from directory-images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'directory-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policy for update (admins only)
CREATE POLICY "Admin can update directory-images"
  ON storage.objects
  FOR UPDATE
  WITH CHECK (
    bucket_id = 'directory-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ==== Policies for `avatars` bucket (user avatars) ====
-- Allow read for public avatars (if your app serves them publicly)
CREATE POLICY "Public access to avatars"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow upload to avatars by owner or admin
CREATE POLICY "Avatars upload owner_or_admin"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      -- owner (when the object's metadata includes user_id) OR admin in profiles
      auth.uid() = (current_setting('request.jwt.claims', true)::json ->> 'sub')::uuid
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
      )
    )
  );

-- Allow delete/update by owner or admin
CREATE POLICY "Avatars delete owner_or_admin"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (
      auth.uid() = (current_setting('request.jwt.claims', true)::json ->> 'sub')::uuid
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
      )
    )
  );

CREATE POLICY "Avatars update owner_or_admin"
  ON storage.objects
  FOR UPDATE
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      auth.uid() = (current_setting('request.jwt.claims', true)::json ->> 'sub')::uuid
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
      )
    )
  );

-- ALTERNATIVE: Si vos JWT incluent le claim `role`, vous pouvez utiliser
-- cette version des policies (toujours owner-only) qui vérifie directement
-- le rôle contenu dans le token plutôt que de joindre `public.profiles`.
-- Cela peut éviter des problèmes si l'appel storage ne voit pas la table
-- `public.profiles` au moment de l'insert.

-- Policy pour uploader (admins via JWT claim)
-- CREATE POLICY "Admin can upload to directory-images"
--   ON storage.objects
--   FOR INSERT
--   WITH CHECK (
--     bucket_id = 'directory-images'
--     AND (current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin'
--   );

-- Policy pour delete (admins via JWT claim)
-- CREATE POLICY "Admin can delete from directory-images"
--   ON storage.objects
--   FOR DELETE
--   USING (
--     bucket_id = 'directory-images'
--     AND (current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin'
--   );

-- Policy pour update (admins via JWT claim)
-- CREATE POLICY "Admin can update directory-images"
--   ON storage.objects
--   FOR UPDATE
--   WITH CHECK (
--     bucket_id = 'directory-images'
--     AND (current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin'
--   );
