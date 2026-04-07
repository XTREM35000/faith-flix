-- Ensure storage bucket for homilies exists and is usable by admins.

INSERT INTO storage.buckets (id, name, public)
VALUES ('homilies', 'homilies', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "homilies objects public read" ON storage.objects;
DROP POLICY IF EXISTS "homilies objects admin insert" ON storage.objects;
DROP POLICY IF EXISTS "homilies objects admin update" ON storage.objects;
DROP POLICY IF EXISTS "homilies objects admin delete" ON storage.objects;

CREATE POLICY "homilies objects public read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'homilies');

CREATE POLICY "homilies objects admin insert"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'homilies'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.role, '')) IN ('admin', 'super_admin', 'moderator', 'developer')
    )
  );

CREATE POLICY "homilies objects admin update"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (
    bucket_id = 'homilies'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.role, '')) IN ('admin', 'super_admin', 'moderator', 'developer')
    )
  )
  WITH CHECK (
    bucket_id = 'homilies'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.role, '')) IN ('admin', 'super_admin', 'moderator', 'developer')
    )
  );

CREATE POLICY "homilies objects admin delete"
  ON storage.objects
  FOR DELETE
  TO public
  USING (
    bucket_id = 'homilies'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(coalesce(p.role, '')) IN ('admin', 'super_admin', 'moderator', 'developer')
    )
  );

