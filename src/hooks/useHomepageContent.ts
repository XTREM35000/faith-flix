import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HomepageContent {
  id: string;
  title?: string;
  subtitle?: string;
  description?: string;
  hero_image?: string;
  featured_video_id?: string;
  cta_text?: string;
  cta_link?: string;
}

export function useHomepageContent() {
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('homepage_content')
        .select('*')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is acceptable
        throw fetchError;
      }

      if (data) {
        setContent(data);
      } else {
        // Provide default content if none exists
        setContent({
          id: 'default',
          title: 'Bienvenue',
          subtitle: 'Paroisse Notre Dame',
          description: 'Découvrez nos vidéos, galeries et événements',
        });
      }
    } catch (err) {
      console.error('Erreur lors du chargement du contenu de la page d\'accueil:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      // Provide default content on error
      setContent({
        id: 'default',
        title: 'Bienvenue',
        subtitle: 'Paroisse Notre Dame',
        description: 'Découvrez nos vidéos, galeries et événements',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return { content, loading, error, refreshContent: fetchContent };
}
