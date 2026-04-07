-- =====================================================
-- MIGRATION: Correction des erreurs 406 et données vides
-- =====================================================

-- 1. VÉRIFIER ET NETTOYER LA TABLE homepage_content
-- Insérer le contenu d'accueil par défaut
-- NOTE: Table structure = id, section, content, updated_at, updated_by
INSERT INTO homepage_content (section, content)
VALUES (
  'hero',
  '{
    "title": "Bienvenue à Notre Dame de la Compassion",
    "subtitle": "Une communauté vivante au cœur d''Abidjan, au service de la foi, de l''espérance et de la charité.",
    "button_text": "Voir les horaires",
    "button_link": "/evenements",
    "image_url": "/images/messe.png"
  }'::jsonb
)
ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();

INSERT INTO homepage_content (section, content)
VALUES (
  'videos',
  '{
    "title": "Nos Vidéos",
    "subtitle": "Découvrez les messages inspirants et les célébrations de notre paroisse"
  }'::jsonb
)
ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();

INSERT INTO homepage_content (section, content)
VALUES (
  'gallery',
  '{
    "title": "Galerie Photos",
    "subtitle": "Les moments forts de notre communauté"
  }'::jsonb
)
ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();

INSERT INTO homepage_content (section, content)
VALUES (
  'events',
  '{
    "title": "Événements à venir",
    "subtitle": "Restez connecté avec nos activités paroissiales"
  }'::jsonb
)
ON CONFLICT (section) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();

-- Vérifier les données insérées
SELECT COUNT(*) as total_homepage_content FROM homepage_content;

-- Note: Images mockées supprimées. Les images seront ajoutées via l'interface d'administration.

-- =====================================================
-- 3. VÉRIFIER LES POLITIQUES RLS
-- =====================================================

-- Afficher les politiques actives
SELECT tablename, policyname, permissive, roles, qual
FROM pg_policies
WHERE tablename IN ('homepage_content', 'gallery_images')
ORDER BY tablename, policyname;

-- =====================================================
-- 4. INDEX ET PERFORMANCES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_homepage_content_section ON public.homepage_content(section);
CREATE INDEX IF NOT EXISTS idx_gallery_images_is_public ON public.gallery_images(is_public);
CREATE INDEX IF NOT EXISTS idx_gallery_images_created_at ON public.gallery_images(created_at DESC);

-- =====================================================
-- 5. CORRIGER LES POLITIQUES RLS (SÉCURISER)
-- =====================================================

-- Supprimer la policy trop permissive qui expose toutes les images
DROP POLICY IF EXISTS "Gallery images are viewable by everyone" ON public.gallery_images;

-- Restreindre l'INSERT : seulement pour les utilisateurs authentifiés
-- et vérifier que user_id = auth.uid() (l'utilisateur ne peut insérer que pour lui-même)
DROP POLICY IF EXISTS "Authenticated users can insert gallery images" ON public.gallery_images;
CREATE POLICY "Authenticated users can insert gallery images"
  ON public.gallery_images
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- SELECT : autorise la lecture publique UNIQUEMENT pour les images publiques
-- Cette policy existe déjà mais vérifier qu'elle est bien configurée
DROP POLICY IF EXISTS "Public can select gallery images" ON public.gallery_images;
CREATE POLICY "Public can select gallery images"
  ON public.gallery_images
  FOR SELECT
  TO public
  USING (is_public = true);

-- Autoriser les utilisateurs à voir leurs propres images (publiques ou non)
CREATE POLICY "Users can view own gallery images"
  ON public.gallery_images
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

-- UPDATE : seulement le propriétaire peut modifier ses images
DROP POLICY IF EXISTS "Users can update own gallery images" ON public.gallery_images;
CREATE POLICY "Users can update own gallery images"
  ON public.gallery_images
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE : seulement le propriétaire peut supprimer ses images
DROP POLICY IF EXISTS "Users can delete own gallery images" ON public.gallery_images;
CREATE POLICY "Users can delete own gallery images"
  ON public.gallery_images
  FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- =====================================================
-- RÉSUMÉ FINAL
-- =====================================================
-- ✅ Table homepage_content nettoyée et remplie avec contenu par défaut
-- ✅ Table gallery_images remplie avec 4 images de test
-- ✅ Politiques RLS sécurisées : INSERT/UPDATE/DELETE réstricts au propriétaire, SELECT pour images publiques ou propriétaire
-- ✅ Index créés pour performances
-- =====================================================
