import type { PageHero } from '@/hooks/usePageHero';

const MAX_HERO_IMAGES = 5;

function parseImagesOrder(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((u) => (typeof u === 'string' ? u.trim() : ''))
      .filter(Boolean)
      .slice(0, MAX_HERO_IMAGES);
  }
  return [];
}

/** URLs d'images hero ordonnées (max 5). Compat: `image_url` seul si pas d'`images_order`. */
export function getOrderedHeroImageUrls(hero: PageHero | null | undefined): string[] {
  if (!hero) return [];
  const fromOrder = parseImagesOrder(hero.images_order);
  if (fromOrder.length > 0) return fromOrder;
  const single = hero.image_url?.trim();
  return single ? [single] : [];
}

export { MAX_HERO_IMAGES };

export type HeroTransitionType = 'fade' | 'slide';

export function normalizeTransitionType(v: string | null | undefined): HeroTransitionType {
  return v === 'slide' ? 'slide' : 'fade';
}

export function normalizeDisplayDurationSeconds(v: number | null | undefined): 3 | 5 | 7 {
  if (v === 3 || v === 5 || v === 7) return v;
  return 5;
}

export function clampSlideshowVisibleCount(n: number | null | undefined): number {
  if (n == null || Number.isNaN(Number(n))) return MAX_HERO_IMAGES;
  return Math.max(0, Math.min(MAX_HERO_IMAGES, Math.round(Number(n))));
}

/**
 * Diaporama page d'accueil : respecte slideshow_visible_count (0 = aucune image affichée).
 * Si aucune ligne `page_hero_banners`, repli sur l'image legacy `homepage_sections.image_url`.
 */
export function getHomepageSlideshowImageUrls(
  pageHero: PageHero | null | undefined,
  sectionFallbackImage?: string | null,
): string[] {
  if (!pageHero) {
    const u = sectionFallbackImage?.trim();
    return u ? [u] : [];
  }
  const urls = getOrderedHeroImageUrls(pageHero);
  let visible = clampSlideshowVisibleCount(pageHero.slideshow_visible_count);
  if (visible <= 0) return [];

  // Compat safety: if old rows defaulted to 1 but several images are configured,
  // don't silently freeze the hero on the first image.
  if (visible === 1 && urls.length > 1) {
    visible = Math.min(urls.length, MAX_HERO_IMAGES);
  }

  if (urls.length > 0) {
    return urls.slice(0, Math.min(visible, MAX_HERO_IMAGES));
  }

  const u = sectionFallbackImage?.trim();
  return u ? [u] : [];
}
