import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotification } from '@/components/ui/notification-system';
// Supabase types can be deeply nested; keep the runtime code simple and use narrow casts where necessary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as unknown as any;

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: number | null;
  views: number;
  category?: string;
  created_at: string;
  description?: string;
  published?: boolean;
}

type VideoInsertData = {
  title: string;
  thumbnail_url?: string | null;
  duration?: number | null;
  category?: string;
  created_at?: string;
  description?: string;
  published?: boolean;
  video_url?: string;
  storage_path?: string;
  poster_url?: string;
};
type VideoUpdateData = Partial<Omit<Video, 'id' | 'created_at'>>;

export const useVideos = (limit = 4, category?: string) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotification();

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const client = sb;
      const query = client
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      let finalQuery: any = query;
      if (category && category !== 'all') {
        finalQuery = finalQuery.eq('category', category);
      }

      const res = await finalQuery.limit(limit);
      const { data, error: fetchError } = res as { data: unknown[] | null; error: unknown };
      /* eslint-enable @typescript-eslint/no-explicit-any */

      if (fetchError) throw fetchError;

      if (data) {
        setVideos(data as Video[]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des vidéos:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      notifyError('Erreur', 'Impossible de charger les vidéos');
    } finally {
      setLoading(false);
    }
  }, [limit, category, notifyError]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const createVideo = async (videoData: VideoInsertData) => {
    try {
      const { data, error } = await sb
        .from('videos')
        .insert([videoData as never])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setVideos(prev => [data as Video, ...prev]);
      }
      notifySuccess('Succès', 'Vidéo publiée avec succès');
      return data as Video | null;
    } catch (err: unknown) {
      notifyError('Erreur', 'Échec de la publication de la vidéo');
      throw err;
    }
  };

  const updateVideo = async (id: string, updates: VideoUpdateData) => {
    try {
      const { data, error } = await sb
        .from('videos')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setVideos(prev => prev.map(video => (video.id === id ? data as Video : video)));
      }
      notifySuccess('Succès', 'Vidéo mise à jour avec succès');
      return data as Video | null;
    } catch (err: unknown) {
      notifyError('Erreur', 'Échec de la mise à jour de la vidéo');
      throw err;
    }
  };

  const deleteVideo = async (id: string) => {
    try {
      const { error } = await sb
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVideos(prev => prev.filter(video => video.id !== id));
      notifySuccess('Succès', 'Vidéo supprimée avec succès');
    } catch (err: unknown) {
      notifyError('Erreur', 'Échec de la suppression de la vidéo');
      throw err;
    }
  };

  return { videos, loading, error, createVideo, updateVideo, deleteVideo, refreshVideos: fetchVideos };
};
