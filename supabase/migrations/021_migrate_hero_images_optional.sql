-- ============================================================================
-- MIGRATION SQL OPTIONNELLE: Ajouter colonne image_storage_path
-- ============================================================================
-- 
-- À exécuter APRÈS avoir validé le migration-hero-images-mapping.json
-- 
-- Exécuter dans: Supabase Dashboard → Your Project → SQL Editor
-- 
-- ============================================================================

-- Étape 1: Ajouter colonne image_storage_path (optionnel, pour future-proofing)
-- Cette colonne stockera la clé de stockage (ex: "hero-images/timestamp_file.png")
-- plutôt que l'URL complète, ce qui permet une meilleure maintenabilité

ALTER TABLE public.page_hero_banners 
ADD COLUMN IF NOT EXISTS image_storage_path TEXT DEFAULT NULL;

-- Ajouter commentaire pour clarifier le rôle
COMMENT ON COLUMN public.page_hero_banners.image_storage_path IS 
'Storage key in Supabase bucket (e.g., "hero-images/timestamp_image.png"). 
Preferred over image_url for maintainability and CDN optimization.';

-- ============================================================================
-- Étape 2: [EXEMPLE] Migrer les références locales vers Supabase
-- ============================================================================
-- 
-- Après la migration du script Node.js, vous pouvez utiliser ce template
-- pour mettre à jour image_storage_path depuis le mapping.
--
-- ATTENTION: Adapter les chemins selon votre mapping réel!
-- 

-- Exemple 1: Migration pour /images/bapteme.png
-- (remplacer la valeur par celle du migration-hero-images-mapping.json)
UPDATE public.page_hero_banners 
SET image_storage_path = 'hero-images/1234567890_bapteme.png'
WHERE image_url LIKE '%/images/bapteme.png' OR image_url LIKE '%bapteme.png';

-- Exemple 2: Migration pour /images/prieres.png
UPDATE public.page_hero_banners 
SET image_storage_path = 'hero-images/1234567890_prieres.png'
WHERE image_url LIKE '%/images/prieres.png' OR image_url LIKE '%prieres.png';

-- Exemple 3: Migration pour /images/gallery/homelies.png
UPDATE public.page_hero_banners 
SET image_storage_path = 'hero-images/1234567890_homelies.png'
WHERE image_url LIKE '%/images/gallery/homelies.png' OR image_url LIKE '%homelies.png';

-- Et ainsi de suite pour chaque image du mapping...

-- ============================================================================
-- Étape 3: [OPTIONNEL] Créer une vue pour l'accès normalisé
-- ============================================================================
-- 
-- Cette vue retourne toujours une URL Supabase valide, 
-- idéal pour éviter les changements dans les requêtes frontend

CREATE OR REPLACE VIEW public.page_hero_banners_with_url AS
SELECT 
  id,
  path,
  image_url,
  image_storage_path,
  metadata,
  updated_at,
  -- Construit l'URL Supabase si image_storage_path existe, sinon retourne image_url
  CASE 
    WHEN image_storage_path IS NOT NULL THEN
      (SELECT current_setting('app.supabase_url', true) || 
        '/storage/v1/object/public/gallery/' || image_storage_path)
    ELSE image_url
  END AS final_image_url
FROM public.page_hero_banners;

-- ============================================================================
-- Étape 4: Vérifier le résultat de la migration
-- ============================================================================
-- 

-- Voir toutes les bannières et leurs URLs finales:
SELECT path, image_url, image_storage_path, final_image_url 
FROM public.page_hero_banners_with_url 
ORDER BY updated_at DESC;

-- Compter combien ont été migrées:
SELECT 
  COUNT(*) as total,
  COUNT(image_storage_path) as with_storage_path,
  COUNT(image_url) as with_image_url,
  COUNT(CASE WHEN image_url LIKE '%/images/%' THEN 1 END) as still_local
FROM public.page_hero_banners;

-- ============================================================================
-- Étape 5: [OPTIONNEL] Ajouter contrainte RLS pour la vue
-- ============================================================================
-- 
-- NOTE: Les vues n'ont pas de RLS propre ; l'RLS de la table source
-- (public.page_hero_banners) s'applique automatiquement.
-- La table page_hero_banners a déjà RLS activé avec les politiques nécessaires.
-- Aucune action supplémentaire requise.

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- 1. image_url vs image_storage_path:
--    - image_url: URL complète (old way)
--    - image_storage_path: clé de stockage (new way, recommandé)
--    - Les deux peuvent coexister pendant la transition
-- 
-- 2. Supabase URL:
--    - Remplacer le hardcoding en construisant dynamiquement:
--    - SELECT current_setting('app.supabase_url')
--    - Ou passer l'URL via les paramètres de configuration
-- 
-- 3. Rollback:
--    - DROP VIEW public.page_hero_banners_with_url;
--    - ALTER TABLE public.page_hero_banners DROP COLUMN image_storage_path;
-- 
-- 4. Performance:
--    - Considérer un index sur (path) pour les lookups rapides
--    - CREATE INDEX idx_page_hero_banners_path ON public.page_hero_banners(path);
-- 

-- ============================================================================
