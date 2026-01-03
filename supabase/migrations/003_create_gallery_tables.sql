-- 003_create_gallery_tables.sql

-- Extension needed for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table des catégories/albums de galerie
CREATE TABLE IF NOT EXISTS gallery_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table principale des images
CREATE TABLE IF NOT EXISTS gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    description TEXT,
    image_url TEXT NOT NULL,        -- URL publique depuis Supabase Storage
    thumbnail_url TEXT,             -- URL miniature facultative
    category_id UUID REFERENCES gallery_categories(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index utile pour les filtres par date / catégorie
-- If the table existed before without `category_id`, ensure the column exists before creating the index
ALTER TABLE gallery_images
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES gallery_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_gallery_images_category_created_at ON gallery_images (category_id, created_at DESC);

-- Ensure optional columns exist when running against an existing table
ALTER TABLE gallery_images
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enable Row Level Security
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les images publiques
DROP POLICY IF EXISTS "Public can select gallery images" ON gallery_images;
CREATE POLICY "Public can select gallery images"
  ON gallery_images
  FOR SELECT
  USING (is_public = true);

-- Les utilisateurs authentifiés peuvent insérer leurs images (user_id MUST = auth.uid())
DROP POLICY IF EXISTS "Authenticated users can insert gallery images" ON gallery_images;
CREATE POLICY "Authenticated users can insert gallery images"
  ON gallery_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres images
DROP POLICY IF EXISTS "Users can update own gallery images" ON gallery_images;
CREATE POLICY "Users can update own gallery images"
  ON gallery_images
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres images
DROP POLICY IF EXISTS "Users can delete own gallery images" ON gallery_images;
CREATE POLICY "Users can delete own gallery images"
  ON gallery_images
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour gallery_categories
ALTER TABLE gallery_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON gallery_categories;
CREATE POLICY "Categories are viewable by everyone"
  ON gallery_categories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert categories" ON gallery_categories;
CREATE POLICY "Authenticated users can insert categories"
  ON gallery_categories
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Notes:
-- - Si vous avez besoin d'un contrôle admin, créez une table `user_roles` ou utilisez les custom claims
--   et adaptez les policies pour autoriser les admins à UPDATE/DELETE.
-- - Si `gallery_images` existe déjà, utilisez ALTER TABLE pour ajouter les colonnes manquantes:
--   ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
--   ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

