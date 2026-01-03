import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

export interface PageHero {
  id: string;
  path: string;
  image_url?: string | null;
  metadata?: Record<string, unknown> | null;
  updated_at?: string;
}

// Create a separate client instance to avoid typing issues
const supabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

const fetchHero = async (path: string): Promise<PageHero | null> => {
  try {
    // Use untyped client to avoid TypeScript schema mismatch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseClient as any)
      .from('page_hero_banners')
      .select('*')
      .eq('path', path)
      .maybeSingle();

    if (error) {
      console.error('Error fetching hero:', error);
      return null;
    }
    
    return data ? (data as PageHero) : null;
  } catch (err) {
    console.error('Error in fetchHero:', err);
    return null;
  }
};

export default function usePageHero(path: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['page-hero', path],
    queryFn: () => fetchHero(path),
    enabled: !!path,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: async (payload: { path: string; image_url: string | null }) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabaseClient as any)
          .from('page_hero_banners')
          .upsert(
            { 
              path: payload.path, 
              image_url: payload.image_url, 
              updated_at: new Date().toISOString() 
            },
            { onConflict: 'path' }
          )
          .select()
          .maybeSingle();
        
        if (error) {
          console.error('Error upserting hero:', error);
          return null;
        }
        
        return data ? (data as PageHero) : null;
      } catch (err) {
        console.error('Error in mutation:', err);
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page-hero', path] });
    }
  });

  return {
    ...query,
    save: async (image_url: string | null): Promise<void> => {
      try {
        await mutation.mutateAsync({ path, image_url });
      } catch (err) {
        console.warn('Could not save hero:', err);
      }
    },
  };
}
