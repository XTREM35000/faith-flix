-- fix_rls_policies.sql
-- Script pour corriger les policies RLS liées à la galerie et policies Storage
BEGIN;

-- 1) S'assurer des colonnes et valeurs par défaut
ALTER TABLE IF EXISTS public.gallery_images
  ALTER COLUMN IF EXISTS is_public SET DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gallery_images' AND column_name = 'views'
  ) THEN
    ALTER TABLE public.gallery_images ADD COLUMN views integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gallery_images' AND column_name = 'downloads'
  ) THEN
    ALTER TABLE public.gallery_images ADD COLUMN downloads integer DEFAULT 0;
  END IF;
END$$;

-- 2) Corriger la policy d'INSERT pour permettre l'insert lorsque user_id est fourni ou absent
DROP POLICY IF EXISTS "Authenticated users can insert gallery images" ON public.gallery_images;
CREATE POLICY "Enable insert for authenticated users"
  ON public.gallery_images FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

-- 3) Recréer une policy SELECT permissive (public si is_public ou owner)
DROP POLICY IF EXISTS "Gallery images are viewable by everyone" ON public.gallery_images;
DROP POLICY IF EXISTS "Public can select gallery images" ON public.gallery_images;
CREATE POLICY "Enable read access for all users"
  ON public.gallery_images FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- 4) Storage policies: autoriser upload dans le bucket 'gallery' pour users authentifiés
-- Ces policies doivent être exécutées dans le schéma public car storage.objects est créé par Supabase
DO $$
BEGIN
  -- INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'gallery_objects_insert'
  ) THEN
    EXECUTE $$
      CREATE POLICY gallery_objects_insert
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'gallery' AND auth.role() = 'authenticated'
      );
    $$;
  END IF;

  -- SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'gallery_objects_select'
  ) THEN
    EXECUTE $$
      CREATE POLICY gallery_objects_select
      ON storage.objects FOR SELECT
      USING (bucket_id = 'gallery');
    $$;
  END IF;

  -- UPDATE/DELETE policies (owner check)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'gallery_objects_update_delete'
  ) THEN
    EXECUTE $$
      CREATE POLICY gallery_objects_update_delete
      ON storage.objects FOR ALL
      USING (bucket_id = 'gallery' AND auth.uid() = owner)
      WITH CHECK (bucket_id = 'gallery' AND auth.uid() = owner);
    $$;
  END IF;
END$$;

COMMIT;
