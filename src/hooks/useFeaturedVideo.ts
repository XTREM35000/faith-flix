import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchActiveLiveStream, type LiveStream } from '@/lib/supabase/mediaQueries';
import type { Video } from '@/types/database';
import { useParoisse } from '@/contexts/ParoisseContext';

export type FeaturedVideoState =
  | { kind: 'live'; live: LiveStream; video: null }
  | { kind: 'vod'; live: null; video: Video }
  | { kind: 'empty'; live: null; video: null };

/**
 * Lecteur mis en avant sur l’accueil :
 * 1) direct en cours (live_streams.is_active = true — équivalent « en direct » côté admin)
 * 2) sinon dernière vidéo publiée (videos.published = true)
 * 3) sinon placeholder (aucun contenu)
 */
async function fetchLatestPublishedVideo(paroisseId: string | undefined): Promise<Video | null> {
  let q = supabase
    .from('videos')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(1);

  if (paroisseId) q = q.eq('paroisse_id', paroisseId);

  const { data, error } = await q.maybeSingle();

  if (!error && data) {
    return data as Video;
  }

  // Colonne `published` absente ou autre erreur : repli sur status approved (comportement proche)
  if (error && (error.code === '42703' || String(error.message || '').includes('published'))) {
    let q2 = supabase
      .from('videos')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1);
    if (paroisseId) q2 = q2.eq('paroisse_id', paroisseId);
    const { data: d2, error: e2 } = await q2.maybeSingle();
    if (!e2 && d2) return d2 as Video;
  }

  if (error && error.code !== 'PGRST116') {
    console.warn('[useFeaturedVideo] vidéos:', error);
  }
  return null;
}

async function fetchFeatured(paroisseId: string | undefined): Promise<FeaturedVideoState> {
  try {
    const live = await fetchActiveLiveStream();
    if (live) {
      return { kind: 'live', live, video: null };
    }
  } catch (e) {
    console.warn('[useFeaturedVideo] live_streams:', e);
  }

  // Schéma : essayer d'abord `is_active` (standard actuel), puis basculer
  // sur `is_live` pour les anciens schémas qui n'ont pas encore été migrés.
  try {
    const { data: liveByFlag, error: e2 } = await supabase
      .from('live_streams')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!e2 && liveByFlag) {
      return { kind: 'live', live: liveByFlag as LiveStream, video: null };
    }

    // Si la colonne `is_active` est absente ou une erreur liée à cette colonne apparaît,
    // on tente la colonne legacy `is_live` en fallback.
    if (e2) {
      const message = String(e2.message || '').toLowerCase();
      if (e2.code === '42703' || message.includes('is_active') || message.includes('column') ) {
        try {
          const { data: liveByLegacy, error: e3 } = await supabase
            .from('live_streams')
            .select('*')
            .eq('is_live', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!e3 && liveByLegacy) {
            return { kind: 'live', live: liveByLegacy as LiveStream, video: null };
          }
        } catch {
          /* fallback failed, on continue */
        }
      }
    }
  } catch {
    /* ignore et continuer vers les VOD */
  }

  const latest = await fetchLatestPublishedVideo(paroisseId);
  if (latest) {
    return { kind: 'vod', live: null, video: latest };
  }

  return { kind: 'empty', live: null, video: null };
}

export function useFeaturedVideo() {
  const queryClient = useQueryClient();
  const { paroisse } = useParoisse();
  const paroisseId = paroisse?.id;

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['featured-video', paroisseId ?? null],
    queryFn: () => fetchFeatured(paroisseId),
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('public:featured_live_streams')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_streams' },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['featured-video'] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const state = data ?? null;
  const loading = isLoading || isFetching;

  return {
    /** État détaillé */
    state,
    /** Live en cours */
    live: state?.kind === 'live' ? state.live : null,
    /** Dernière VOD mise en avant */
    video: state?.kind === 'vod' ? state.video : null,
    isLive: state?.kind === 'live',
    loading,
    error,
  };
}
