-- =====================================================
-- SCRIPT DE DIAGNOSTIC - Vérifier les erreurs
-- =====================================================
-- Exécute ce script dans l'éditeur SQL de Supabase pour diagnostiquer les problèmes

-- 1. VÉRIFIER LA TABLE homepage_content
SELECT '=== TABLE homepage_content ===' as diagnostic;
SELECT COUNT(*) as total_records FROM homepage_content;
SELECT id, section, content, updated_at FROM homepage_content LIMIT 10;

-- 2. VÉRIFIER LES POLITIQUES RLS - homepage_content
SELECT '=== RLS POLICIES: homepage_content ===' as diagnostic;
SELECT policyname, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'homepage_content';

-- 3. VÉRIFIER LA TABLE gallery_images
SELECT '=== TABLE gallery_images ===' as diagnostic;
SELECT COUNT(*) as total_images,
       COUNT(CASE WHEN is_public THEN 1 END) as public_images,
       COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as with_image_url,
       COUNT(CASE WHEN thumbnail_url IS NOT NULL THEN 1 END) as with_thumbnail
FROM gallery_images;

-- 4. VOIR LES DONNÉES gallery_images
SELECT '=== GALLERY_IMAGES DATA ===' as diagnostic;
SELECT id, title, image_url, thumbnail_url, is_public, created_at 
FROM gallery_images 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. VÉRIFIER LES POLITIQUES RLS - gallery_images
SELECT '=== RLS POLICIES: gallery_images ===' as diagnostic;
SELECT policyname, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'gallery_images';

-- 6. VÉRIFIER LA COLONNE user_id
SELECT '=== GALLERY_IMAGES user_id CHECK ===' as diagnostic;
SELECT COUNT(*) as total,
       COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_id,
       COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_id
FROM gallery_images;

-- 7. VÉRIFIER LA STRUCTURE DES TABLES
SELECT '=== TABLE STRUCTURE ===' as diagnostic;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'homepage_content' 
ORDER BY ordinal_position;

SELECT '=== gallery_images STRUCTURE ===' as diagnostic2;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'gallery_images' 
ORDER BY ordinal_position;

-- 8. VÉRIFIER LES AUTH.USERS
SELECT '=== auth.users COUNT ===' as diagnostic;
SELECT COUNT(*) as total_users FROM auth.users;

-- =====================================================
-- INTERPRÉTATION DES RÉSULTATS:
-- 1. Si homepage_content est vide → INSERT données de test
-- 2. Si gallery_images est vide → INSERT images de test
-- 3. Si RLS policies manquent ou sont restrictives → CREATE POLICY
-- 4. Si user_id est NULL → UPDATE avec un user_id valide
-- =====================================================
