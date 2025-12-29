import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotification } from '@/components/ui/notification-system';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: number | null;
  views: number;
  category?: string;
  created_at: string;
  description?: string;
}

export const useVideos = (limit = 4, category?: string) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotification();

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error: fetchError } = await query.limit(limit);

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

  const createVideo = async (videoData: Omit<Video, 'id' | 'created_at' | 'views'>) => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .insert([videoData])
        .select()
        .single();

      if (error) throw error;

      setVideos(prev => [data, ...prev]);
      notifySuccess('Succès', 'Vidéo publiée avec succès');
      return data;
    } catch (err: any) {
      notifyError('Erreur', 'Échec de la publication de la vidéo');
      throw err;
    }
  };

  const updateVideo = async (id: string, updates: Partial<Video>) => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setVideos(prev => prev.map(video => (video.id === id ? data : video)));
      notifySuccess('Succès', 'Vidéo mise à jour avec succès');
      return data;
    } catch (err: any) {
      notifyError('Erreur', 'Échec de la mise à jour de la vidéo');
      throw err;
    }
  };

  const deleteVideo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVideos(prev => prev.filter(video => video.id !== id));
      notifySuccess('Succès', 'Vidéo supprimée avec succès');
    } catch (err: any) {
      notifyError('Erreur', 'Échec de la suppression de la vidéo');
      throw err;
    }
  };

  return { videos, loading, error, createVideo, updateVideo, deleteVideo, refreshVideos: fetchVideos };
};
