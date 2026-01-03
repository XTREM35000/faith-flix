-- =====================================================
-- QUICK SQL COMMANDS - Copy & Paste
-- =====================================================
-- Utilisez ces commandes dans Supabase SQL Editor

-- =====================================================
-- 1. VÉRIFIER RAPIDEMENT L'ÉTAT
-- =====================================================

-- Combien d'images y a-t-il?
SELECT 
  'gallery_images' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_public THEN 1 END) as public_images,
  COUNT(CASE WHEN is_public = false THEN 1 END) as private_images
FROM gallery_images;

-- Combien de contenus d'accueil y a-t-il?
SELECT 
  'homepage_content' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_active THEN 1 END) as active_content
FROM homepage_content;

-- =====================================================
-- 2. VÉRIFIER LES POLITIQUES RLS
-- =====================================================

-- Afficher toutes les politiques RLS des tables importantes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual as select_condition
FROM pg_policies
WHERE tablename IN ('gallery_images', 'homepage_content')
ORDER BY tablename, policyname;

-- =====================================================
-- 3. INSÉRER DES IMAGES DE TEST (si table vide)
-- =====================================================

-- OPTION 1: Avec un UUID système (le plus sûr pour tester)
INSERT INTO gallery_images (
  title, 
  description,
  image_url, 
  thumbnail_url,
  user_id,
  is_public,
  views,
  metadata
)
VALUES 
  (
    'Procession paroissiale',
    'Moment solennel de notre paroisse',
    'https://via.placeholder.com/800x600?text=Procession',
    'https://via.placeholder.com/400x300?text=Procession',
    (SELECT id FROM profiles LIMIT 1),
    true,
    0,
    '{"likes": 42, "comments": 8}'::jsonb
  ),
  (
    'Messe dominicale',
    'Célébration hebdomadaire',
    'https://via.placeholder.com/800x600?text=Messe',
    'https://via.placeholder.com/400x300?text=Messe',
    (SELECT id FROM profiles LIMIT 1),
    true,
    0,
    '{"likes": 56, "comments": 12}'::jsonb
  ),
  (
    'Événement communautaire',
    'Moment de partage entre fidèles',
    'https://via.placeholder.com/800x600?text=Evenement',
    'https://via.placeholder.com/400x300?text=Evenement',
    (SELECT id FROM profiles LIMIT 1),
    true,
    0,
    '{"likes": 34, "comments": 6}'::jsonb
  )
ON CONFLICT DO NOTHING
RETURNING id, title, image_url, is_public;

-- =====================================================
-- 4. INSÉRER LE CONTENU D'ACCUEIL (si table vide)
-- =====================================================

INSERT INTO homepage_content (section, title, subtitle, content, is_active)
VALUES
  (
    'hero',
    'Bienvenue à Notre Dame de la Compassion',
    'Une communauté vivante au cœur d''Abidjan',
    '{
      "title": "Bienvenue à Notre Dame de la Compassion",
      "subtitle": "Une communauté vivante au cœur d''Abidjan, au service de la foi, de l''espérance et de la charité.",
      "button_text": "Voir les horaires",
      "button_link": "/evenements",
      "image_url": "/images/messe.png"
    }'::jsonb,
    true
  ),
  (
    'videos',
    'Nos Vidéos',
    'Découvrez les messages et célébrations',
    '{
      "title": "Nos Vidéos",
      "subtitle": "Découvrez les messages inspirants et les célébrations de notre paroisse"
    }'::jsonb,
    true
  ),
  (
    'gallery',
    'Galerie Photos',
    'Les moments forts de notre communauté',
    '{
      "title": "Galerie Photos",
      "subtitle": "Les moments forts de notre communauté"
    }'::jsonb,
    true
  ),
  (
    'events',
    'Événements à venir',
    'Restez connecté avec nos activités',
    '{
      "title": "Événements à venir",
      "subtitle": "Restez connecté avec nos activités paroissiales"
    }'::jsonb,
    true
  )
ON CONFLICT (section) DO UPDATE SET
  is_active = true,
  updated_at = NOW()
RETURNING id, section, title;

-- =====================================================
-- 5. VÉRIFIER APRÈS INSERTION
-- =====================================================

-- Voir les 5 dernières images
SELECT id, title, is_public, created_at FROM gallery_images ORDER BY created_at DESC LIMIT 5;

-- Voir tous les contenus d'accueil actifs
SELECT id, section, title, is_active FROM homepage_content WHERE is_active ORDER BY section;

-- =====================================================
-- 6. CORRIGER UN PROBLÈME: RLS trop restrictive?
-- =====================================================

-- Si gallery_images n'est pas visible au public, exécuter:
CREATE POLICY IF NOT EXISTS "Public can view public gallery images"
  ON gallery_images
  FOR SELECT
  USING (is_public = true);

-- Si homepage_content n'est pas visible au public, exécuter:
CREATE POLICY IF NOT EXISTS "Public can view active content"
  ON homepage_content
  FOR SELECT
  USING (is_active = true);

-- =====================================================
-- 7. NETTOYER/RÉINITIALISER (ATTENTION: Destructif!)
-- =====================================================

-- ⚠️  Supprimer TOUTES les images de test (attention!)
-- DELETE FROM gallery_images WHERE image_url LIKE '%placeholder%';

-- ⚠️  Supprimer TOUT le contenu d'accueil (attention!)
-- DELETE FROM homepage_content;

-- =====================================================
-- NOTES IMPORTANTES:
-- =====================================================
-- 1. Les images avec is_public = true seront visibles à tout le monde
-- 2. Les images avec is_public = false seront visibles seulement aux propriétaires/admins
-- 3. Le contenu d'accueil avec is_active = true sera visible au public
-- 4. Les images placeholder.com sont pour tester - à remplacer par des vraies images
-- 5. Après insertion, les logs en console devraient afficher les images chargées
-- 6. Utiliser Shift+Ctrl+K pour formater le SQL dans l'éditeur
-- =====================================================
