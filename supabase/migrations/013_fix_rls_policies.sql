-- Activer RLS pour videos et gallery_images si pas déjà fait
ALTER TABLE IF EXISTS public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gallery_images ENABLE ROW LEVEL SECURITY;

-- ===== POLICIES POUR VIDEOS =====

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS videos_select_public ON public.videos;
DROP POLICY IF EXISTS videos_insert_admin ON public.videos;
DROP POLICY IF EXISTS videos_update_owner_or_admin ON public.videos;
DROP POLICY IF EXISTS videos_delete_owner_or_admin ON public.videos;

-- SELECT: tout utilisateur authentifié, ou vidéos publiées pour le public
CREATE POLICY videos_select_public
ON public.videos
FOR SELECT
USING (
  auth.role() = 'authenticated'
  OR published = true
);

-- INSERT: admins ou propriétaire
CREATE POLICY videos_insert_authenticated
ON public.videos
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND (
    auth.uid() = user_id
    OR (current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin'
  )
);

-- UPDATE: propriétaire ou admin
CREATE POLICY videos_update_owner_or_admin
ON public.videos
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND (
    auth.uid() = user_id
    OR (current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin'
  )
)
WITH CHECK (
  auth.role() = 'authenticated' AND (
    auth.uid() = user_id
    OR (current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin'
  )
);

-- DELETE: propriétaire ou admin
CREATE POLICY videos_delete_owner_or_admin
ON public.videos
FOR DELETE
USING (
  auth.role() = 'authenticated' AND (
    auth.uid() = user_id
    OR (current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin'
  )
);

-- ===== POLICIES POUR GALLERY_IMAGES =====

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS gallery_images_select_public ON public.gallery_images;
DROP POLICY IF EXISTS gallery_images_insert_admin ON public.gallery_images;
DROP POLICY IF EXISTS gallery_images_update_admin ON public.gallery_images;
DROP POLICY IF EXISTS gallery_images_delete_admin ON public.gallery_images;

-- SELECT: images publiques pour tous, authenticated pour non-publiques
CREATE POLICY gallery_images_select_public
ON public.gallery_images
FOR SELECT
USING (
  is_public = true
  OR auth.role() = 'authenticated'
);

-- INSERT: admins ou propriétaire
CREATE POLICY gallery_images_insert_authenticated
ON public.gallery_images
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND (
    auth.uid() = user_id
    OR (current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin'
  )
);

-- UPDATE: propriétaire ou admin
CREATE POLICY gallery_images_update_owner_or_admin
ON public.gallery_images
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND (
    auth.uid() = user_id
    OR (current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin'
  )
)
WITH CHECK (
  auth.role() = 'authenticated' AND (
    auth.uid() = user_id
    OR (current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin'
  )
);

-- DELETE: propriétaire ou admin
CREATE POLICY gallery_images_delete_owner_or_admin
ON public.gallery_images
FOR DELETE
USING (
  auth.role() = 'authenticated' AND (
    auth.uid() = user_id
    OR (current_setting('request.jwt.claims', true)::json ->> 'role') = 'admin'
  )
);
