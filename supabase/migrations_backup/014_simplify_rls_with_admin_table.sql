-- Migration 014: Simplified RLS policies pour permettre la suppression par tous les admins

-- Créer une table de mapping admin si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insérer l'utilisateur admin actuel (remplace avec l'ID réel si besoin)
-- Pour le moment, on laisse la table vide et on la remplit manuellement

-- ===== POLICIES SIMPLIFIÉES POUR VIDEOS =====

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS videos_select_public ON public.videos;
DROP POLICY IF EXISTS videos_insert_authenticated ON public.videos;
DROP POLICY IF EXISTS videos_update_owner_or_admin ON public.videos;
DROP POLICY IF EXISTS videos_delete_owner_or_admin ON public.videos;

-- SELECT: tout utilisateur authentifié
CREATE POLICY videos_select_all
ON public.videos
FOR SELECT
USING (auth.role() = 'authenticated' OR published = true);

-- INSERT: tout utilisateur authentifié
CREATE POLICY videos_insert_all
ON public.videos
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: propriétaire ou admin enregistré
CREATE POLICY videos_update_all
ON public.videos
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  )
)
WITH CHECK (
  auth.role() = 'authenticated' AND (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  )
);

-- DELETE: propriétaire ou admin enregistré
CREATE POLICY videos_delete_all
ON public.videos
FOR DELETE
USING (
  auth.role() = 'authenticated' AND (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  )
);

-- ===== POLICIES SIMPLIFIÉES POUR GALLERY_IMAGES =====

DROP POLICY IF EXISTS gallery_images_select_public ON public.gallery_images;
DROP POLICY IF EXISTS gallery_images_insert_authenticated ON public.gallery_images;
DROP POLICY IF EXISTS gallery_images_update_owner_or_admin ON public.gallery_images;
DROP POLICY IF EXISTS gallery_images_delete_owner_or_admin ON public.gallery_images;

-- SELECT
CREATE POLICY gallery_images_select_all
ON public.gallery_images
FOR SELECT
USING (auth.role() = 'authenticated' OR is_public = true);

-- INSERT
CREATE POLICY gallery_images_insert_all
ON public.gallery_images
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- UPDATE
CREATE POLICY gallery_images_update_all
ON public.gallery_images
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  )
)
WITH CHECK (
  auth.role() = 'authenticated' AND (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  )
);

-- DELETE
CREATE POLICY gallery_images_delete_all
ON public.gallery_images
FOR DELETE
USING (
  auth.role() = 'authenticated' AND (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  )
);

-- ===== AJOUTER L'ADMIN ACTUEL =====
-- Remplace a146c95b-131b-4d31-95a1-324e15179c99 par l'ID réel de ton utilisateur admin
-- INSERT INTO public.admin_users (id)
-- VALUES ('a146c95b-131b-4d31-95a1-324e15179c99')
-- ON CONFLICT (id) DO NOTHING;
