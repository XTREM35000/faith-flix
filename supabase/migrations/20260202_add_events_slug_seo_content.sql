-- 2026-02-02: Ajouter colonnes slug/seo/content aux événements et backfill des slugs (idempotent)
-- Ajoute les colonnes `slug`, `seo_title`, `seo_description`, `content` sur `public.events`.
-- Génère des slugs lisibles et uniques pour les événements existants et applique une contrainte unique si nécessaire.

BEGIN;

-- 1) Ajouter les colonnes si elles n'existent pas
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS slug TEXT;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS seo_title TEXT;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS seo_description TEXT;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS content TEXT;

-- 2) Backfill & dédoublonnage: assurer que chaque événement a un slug unique
DO $$
DECLARE
  rec RECORD;
  base TEXT;
  candidate TEXT;
  idx INT;
BEGIN
  FOR rec IN SELECT id, COALESCE(slug, '') AS slug, COALESCE(title, '') AS title FROM public.events ORDER BY created_at NULLS FIRST, id LOOP
    -- Si slug absent ou vide: générer à partir du titre
    IF rec.slug IS NULL OR trim(rec.slug) = '' THEN
      base := lower(
        regexp_replace(
          regexp_replace(rec.title, '[^a-z0-9\s\-]', '', 'gi'),
          '[\s\-]+', '-', 'g'
        )
      );

      IF base IS NULL OR base = '' THEN
        base := 'event-' || rec.id::text;
      END IF;

      candidate := base;
      idx := 1;

      WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = candidate) LOOP
        candidate := base || '-' || idx;
        idx := idx + 1;
      END LOOP;

      UPDATE public.events SET slug = candidate WHERE id = rec.id;

    ELSE
      -- Si le slug existe mais est dupliqué, ajouter un suffixe pour rendre unique
      IF EXISTS (SELECT 1 FROM public.events e2 WHERE e2.slug = rec.slug AND e2.id <> rec.id) THEN
        base := rec.slug;
        candidate := base;
        idx := 1;
        WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = candidate AND id <> rec.id) LOOP
          candidate := base || '-' || idx;
          idx := idx + 1;
        END LOOP;
        UPDATE public.events SET slug = candidate WHERE id = rec.id;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3) Nettoyage: s'assurer qu'aucun slug ne soit vide (au cas où)
UPDATE public.events
SET slug = 'event-' || id::text
WHERE slug IS NULL OR trim(slug) = '';

-- 4) Ajout idempotent de la contrainte UNIQUE si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_slug_unique') THEN
    ALTER TABLE public.events ADD CONSTRAINT events_slug_unique UNIQUE (slug);
  ELSE
    RAISE NOTICE 'Constraint events_slug_unique already exists, skipping.';
  END IF;
END;
$$;

-- 5) Rendre slug NOT NULL uniquement si aucune ligne n'est nulle/empty
DO $$
DECLARE cnt INT;
BEGIN
  SELECT count(*) INTO cnt FROM public.events WHERE slug IS NULL OR trim(slug) = '';
  IF cnt = 0 THEN
    EXECUTE 'ALTER TABLE public.events ALTER COLUMN slug SET NOT NULL';
  ELSE
    RAISE NOTICE 'Skipping setting slug NOT NULL: % rows with null/empty slug', cnt;
  END IF;
END;
$$;

-- 6) Commentaires (avec quotes échappées)
COMMENT ON COLUMN public.events.slug IS 'Slug URL-friendly pour l''URL de la page d''événement';
COMMENT ON COLUMN public.events.seo_title IS 'Titre SEO optionnel pour la page d''événement';
COMMENT ON COLUMN public.events.seo_description IS 'Description SEO optionnelle';
COMMENT ON COLUMN public.events.content IS 'Contenu HTML/markdown optionnel pour la page d''événement';

COMMIT;
