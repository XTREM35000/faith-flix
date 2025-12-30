import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GalleryImage {
  id: string;
  title: string;
  imageUrl: string;
  likes: number;
  comments: number;
  description?: string;
  category?: string;
}

export function useGalleryImages(limit = 50) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const query = (supabase
        .from('gallery_images' as never)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)) as unknown;

      const res = await query;
      const { data, error: fetchError } = res as { data: unknown[] | null; error: unknown };

      if (fetchError) throw fetchError;

      if (data) {
        // Map database columns to GalleryImage interface safely
        const mappedImages: GalleryImage[] = (data || []).map((img) => {
          const r = img as Record<string, unknown>;
          return {
            id: String(r.id ?? ''),
            title: String(r.title ?? 'Sans titre'),
            imageUrl: String((r['image_url'] ?? r['url']) ?? ''),
            likes: Number(r['likes'] ?? 0),
            comments: Number(r['comments'] ?? 0),
            description: (r['description'] as string | undefined) ?? undefined,
            category: (r['category'] as string | undefined) ?? undefined,
          };
        });
        setImages(mappedImages);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des images de galerie:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return { images, loading, error, refreshImages: fetchImages };
}
