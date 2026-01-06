/**
 * src/lib/images.ts
 * 
 * Helpers pour normaliser les URLs des images du Hero Banner.
 * Centralise la logique de construction d'URL Supabase publique.
 */

import { supabase } from '@/integrations/supabase/client';

export const IMAGE_BUCKETS = {
  gallery: 'gallery',
  heroImages: 'gallery', // Les images du hero sont dans le bucket 'gallery' sous 'hero-images/'
} as const;

/**
 * Construit une URL publique Supabase à partir d'une clé de stockage.
 * 
 * @param key - Clé de stockage (ex: 'hero-images/[timestamp]_bapteme.png')
 * @param bucket - Bucket Supabase (défaut: 'gallery')
 * @returns URL publique complète OU null si clé invalide
 */
export function heroPublicUrlFromKey(
  key: string | null | undefined,
  bucket = IMAGE_BUCKETS.gallery
): string | null {
  if (!key) return null;
  
  // Si c'est déjà une URL complète, la retourner telle quelle
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(key);
    return data?.publicUrl || null;
  } catch (e) {
    console.error('[heroPublicUrlFromKey] Error constructing URL for key:', key, e);
    return null;
  }
}

/**
 * Normalise une source d'image (locale, URL, ou clé Supabase) vers une URL publique.
 * Utile pour la migration : accepte `/images/...` et les convertit en Supabase.
 * 
 * Note: Cette fonction est provisoire (pour transition). 
 * À long terme, toutes les images devraient être stockées en Supabase.
 * 
 * @param src - Source: `/images/...` OU clé Supabase OU URL complète
 * @param fallbackUrl - URL à utiliser si src ne peut pas être normalisé
 * @returns URL normalisée OU fallbackUrl
 */
export function normalizeImageUrl(
  src: string | null | undefined,
  fallbackUrl?: string
): string | null {
  if (!src) return fallbackUrl || null;
  
  // Si c'est déjà une URL HTTP(S), retourner
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // Si c'est un chemin local `/images/...`, utiliser comme-est pour compatibilité transitoire
  // (À remettre en Supabase au besoin)
  if (src.startsWith('/images/')) {
    return src;
  }
  
  // Sinon, c'est probablement une clé Supabase
  const normalized = heroPublicUrlFromKey(src);
  return normalized || fallbackUrl || null;
}

/**
 * Retourne l'URL d'une image du hero, avec fallback intelligent.
 * Priorisation : imageUrl Supabase > imageStoragePath > fallback local
 * 
 * @param params.imageUrl - URL stockée en DB (peut être Supabase ou local)
 * @param params.imageStoragePath - Clé de stockage Supabase (futur, optionnel)
 * @param params.fallbackLocal - Fallback local `/images/...`
 * @returns URL finale à utiliser dans <img src={...} />
 */
export function getHeroImageUrl({
  imageUrl,
  imageStoragePath,
  fallbackLocal,
}: {
  imageUrl?: string | null;
  imageStoragePath?: string | null;
  fallbackLocal?: string;
}): string | null {
  // Priorité 1: Si on a une clé Supabase récente (après migration)
  if (imageStoragePath) {
    const url = heroPublicUrlFromKey(imageStoragePath);
    if (url) return url;
  }
  
  // Priorité 2: Si on a déjà une URL stockée en DB
  if (imageUrl) {
    return normalizeImageUrl(imageUrl, fallbackLocal);
  }
  
  // Priorité 3: Fallback local
  return fallbackLocal || null;
}
