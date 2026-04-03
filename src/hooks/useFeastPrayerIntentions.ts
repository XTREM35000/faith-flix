import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { FeastPrayerIntention } from '@/types/religiousFeasts';

export function useFeastPrayerIntentions(feastId?: string) {
  const [intentions, setIntentions] = useState<FeastPrayerIntention[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIntentions = useCallback(async () => {
    if (!feastId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: qError } = await supabase
        .from('feast_prayer_intentions')
        .select('*')
        .eq('feast_id', feastId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (qError) throw qError;
      setIntentions((data ?? []) as FeastPrayerIntention[]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur chargement des intentions.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [feastId]);

  const addIntention = useCallback(
    async (intention: string, isPublic: boolean) => {
      if (!feastId) throw new Error('Feast ID manquant');
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error('Utilisateur non connecte');

      const { error: insertError } = await supabase.from('feast_prayer_intentions').insert([
        {
          feast_id: feastId,
          user_id: userId,
          intention,
          is_public: isPublic,
        },
      ]);
      if (insertError) throw insertError;
      await loadIntentions();
    },
    [feastId, loadIntentions],
  );

  useEffect(() => {
    void loadIntentions();
  }, [loadIntentions]);

  return { intentions, loading, error, refresh: loadIntentions, addIntention };
}
