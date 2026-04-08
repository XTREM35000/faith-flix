-- Nombre d'images visibles sur l'accueil (0 = aucune image de diaporama, 1–5).

ALTER TABLE public.page_hero_banners
  ADD COLUMN IF NOT EXISTS slideshow_visible_count integer NOT NULL DEFAULT 5;

ALTER TABLE public.page_hero_banners
  DROP CONSTRAINT IF EXISTS page_hero_banners_slideshow_visible_count_check;

ALTER TABLE public.page_hero_banners
  ADD CONSTRAINT page_hero_banners_slideshow_visible_count_check
  CHECK (slideshow_visible_count >= 0 AND slideshow_visible_count <= 5);

COMMENT ON COLUMN public.page_hero_banners.slideshow_visible_count IS
  'Accueil : combien d''images du tableau images_order afficher (0 = pas d''images).';
