-- Slideshow / carousel metadata for page_hero_banners (RLS policies unchanged)

ALTER TABLE public.page_hero_banners
  ADD COLUMN IF NOT EXISTS transition_type text NOT NULL DEFAULT 'fade',
  ADD COLUMN IF NOT EXISTS display_duration integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS images_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS slideshow_visible_count integer NOT NULL DEFAULT 5;

COMMENT ON COLUMN public.page_hero_banners.transition_type IS 'fade | slide (diaporama accueil)';
COMMENT ON COLUMN public.page_hero_banners.display_duration IS 'Durée d''affichage d''une image en secondes (ex. 3, 5, 7)';
COMMENT ON COLUMN public.page_hero_banners.images_order IS 'Tableau JSON d''URLs d''images hero (ordre d''affichage, max 5 côté app)';
COMMENT ON COLUMN public.page_hero_banners.slideshow_visible_count IS
  'Accueil : combien d''images du tableau images_order afficher (0 = pas d''images).';

UPDATE public.page_hero_banners
SET transition_type = 'fade'
WHERE transition_type IS NULL OR transition_type NOT IN ('fade', 'slide');

UPDATE public.page_hero_banners
SET display_duration = 5
WHERE display_duration IS NULL OR display_duration NOT IN (3, 5, 7);

UPDATE public.page_hero_banners
SET slideshow_visible_count = 5
WHERE slideshow_visible_count IS NULL OR slideshow_visible_count < 0 OR slideshow_visible_count > 5;

ALTER TABLE public.page_hero_banners
  DROP CONSTRAINT IF EXISTS page_hero_banners_transition_type_check;

ALTER TABLE public.page_hero_banners
  ADD CONSTRAINT page_hero_banners_transition_type_check
  CHECK (transition_type IN ('fade', 'slide'));

ALTER TABLE public.page_hero_banners
  DROP CONSTRAINT IF EXISTS page_hero_banners_display_duration_check;

ALTER TABLE public.page_hero_banners
  ADD CONSTRAINT page_hero_banners_display_duration_check
  CHECK (display_duration IN (3, 5, 7));

ALTER TABLE public.page_hero_banners
  DROP CONSTRAINT IF EXISTS page_hero_banners_slideshow_visible_count_check;

ALTER TABLE public.page_hero_banners
  ADD CONSTRAINT page_hero_banners_slideshow_visible_count_check
  CHECK (slideshow_visible_count >= 0 AND slideshow_visible_count <= 5);
