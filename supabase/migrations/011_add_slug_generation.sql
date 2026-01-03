-- Ajouter la colonne slug si elle n'existe pas
ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Remplir les slugs existants pour les videos sans slug
UPDATE public.videos
SET slug = lower(
  regexp_replace(
    regexp_replace(title, '[^a-z0-9\s\-]', '', 'gi'),
    '[\s\-]+', '-', 'g'
  )
)
WHERE slug IS NULL OR slug = '';

-- Créer une fonction pour générer un slug
CREATE OR REPLACE FUNCTION generate_video_slug(title_text text)
RETURNS text AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(title_text, '[^a-z0-9\s\-]', '', 'gi'),
      '[\s\-]+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Créer un trigger pour générer le slug automatiquement
CREATE OR REPLACE FUNCTION videos_before_insert_update_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_video_slug(COALESCE(NEW.title, 'video'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS videos_before_insert_slug ON public.videos;
CREATE TRIGGER videos_before_insert_slug
BEFORE INSERT ON public.videos
FOR EACH ROW
EXECUTE FUNCTION videos_before_insert_update_slug();

DROP TRIGGER IF EXISTS videos_before_update_slug ON public.videos;
CREATE TRIGGER videos_before_update_slug
BEFORE UPDATE ON public.videos
FOR EACH ROW
WHEN (OLD.title IS DISTINCT FROM NEW.title)
EXECUTE FUNCTION videos_before_insert_update_slug();

-- S'assurer que slug est NOT NULL
ALTER TABLE public.videos
ALTER COLUMN slug SET NOT NULL;

-- Ajouter un commentaire
COMMENT ON COLUMN public.videos.slug IS 'Slug URL-friendly généré automatiquement à partir du title';
