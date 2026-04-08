import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as supabaseClient } from '@/integrations/supabase/client';

export interface PageHero {
  id: string;
  path: string;
  title?: string | null;
  subtitle?: string | null;
  image_url?: string | null;
  metadata?: Record<string, unknown> | null;
  updated_at?: string;
  /** 'fade' | 'slide' — diaporama page d'accueil */
  transition_type?: string | null;
  /** Secondes : 3, 5 ou 7 */
  display_duration?: number | null;
  /** URLs ordonnées (max 5 côté client) */
  images_order?: unknown;
  /** Accueil : 0–5 images affichées dans le diaporama */
  slideshow_visible_count?: number | null;
}

// Reuse main supabase client to avoid multiple GoTrue instances

const fetchHero = async (path: string, signal?: AbortSignal): Promise<PageHero | null> => {
  try {
    // Check if signal is aborted before making request
    if (signal?.aborted) {
      return null;
    }

    // Use untyped client to avoid TypeScript schema mismatch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseClient as any)
      .from('page_hero_banners')
      .select('*')
      .eq('path', path)
      .maybeSingle();

    // Check again after async operation
    if (signal?.aborted) {
      return null;
    }

    if (error) {
      console.error('Error fetching hero:', error);
      return null;
    }
    
    return data ? (data as PageHero) : null;
  } catch (err: unknown) {
    // Ignore abort errors
    if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
      console.log('Hero query cancelled');
      return null;
    }
    console.error('Error in fetchHero:', err);
    return null;
  }
};

export default function usePageHero(path: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['page-hero', path],
    queryFn: ({ signal }) => fetchHero(path, signal),
    enabled: !!path,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  const mutation = useMutation({
    mutationFn: async (payload: {
      path: string;
      image_url?: string | null;
      title?: string | null;
      subtitle?: string | null;
      images_order?: string[] | null;
      transition_type?: string | null;
      display_duration?: number | null;
      slideshow_visible_count?: number | null;
    }) => {
      try {
        const body: Record<string, unknown> = {
          path: payload.path,
          updated_at: new Date().toISOString(),
        };
        if (payload.title !== undefined) body.title = payload.title;
        if (payload.subtitle !== undefined) body.subtitle = payload.subtitle;
        if (payload.transition_type !== undefined) body.transition_type = payload.transition_type;
        if (payload.display_duration !== undefined) body.display_duration = payload.display_duration;
        if (payload.slideshow_visible_count !== undefined) {
          body.slideshow_visible_count = payload.slideshow_visible_count;
        }

        if (payload.images_order !== undefined) {
          body.images_order = payload.images_order;
        }
        if (payload.image_url !== undefined) {
          body.image_url = payload.image_url;
        }
        if (payload.images_order !== undefined && payload.image_url === undefined) {
          body.image_url =
            payload.images_order && payload.images_order.length > 0 ? payload.images_order[0]! : null;
        }
        if (payload.image_url !== undefined && payload.images_order === undefined) {
          body.images_order = payload.image_url ? [payload.image_url] : [];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabaseClient as any)
          .from('page_hero_banners')
          .upsert(body, { onConflict: 'path' })
          .select()
          .limit(1);

        if (error) {
          console.error('Error upserting hero:', error);
          return null;
        }

        const row = Array.isArray(data) ? data[0] : data;
        return row ? (row as PageHero) : null;
      } catch (err) {
        console.error('Error in mutation:', err);
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-hero', path] });
    },
  });

  return {
    ...query,
    save: async (
      image_urlOrPayload:
        | string
        | null
        | {
            image_url?: string | null;
            title?: string | null;
            subtitle?: string | null;
            images_order?: string[] | null;
            transition_type?: string | null;
            display_duration?: number | null;
            slideshow_visible_count?: number | null;
          }
    ): Promise<void> => {
      try {
        if (image_urlOrPayload === null || typeof image_urlOrPayload === 'string') {
          await mutation.mutateAsync({ path, image_url: image_urlOrPayload });
        } else {
          await mutation.mutateAsync({
            path,
            image_url: image_urlOrPayload.image_url,
            title: image_urlOrPayload.title,
            subtitle: image_urlOrPayload.subtitle,
            images_order: image_urlOrPayload.images_order,
            transition_type: image_urlOrPayload.transition_type,
            display_duration: image_urlOrPayload.display_duration,
            slideshow_visible_count: image_urlOrPayload.slideshow_visible_count,
          });
        }
      } catch (err) {
        console.warn('Could not save hero:', err);
      }
    },
  };
}
