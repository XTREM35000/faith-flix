import { useCallback, useEffect, useState } from 'react';
import type { OfficiantRow } from '@/types/culte';
import { listAllOfficiantsAdmin } from '@/lib/supabase/culteApi';

/** Liste des officiants pour une paroisse (admin), avec rechargement explicite. */
export function useOfficiants(paroisseId: string | null) {
  const [officiants, setOfficiants] = useState<OfficiantRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!paroisseId) {
      setOfficiants([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await listAllOfficiantsAdmin(paroisseId);
      setOfficiants(rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [paroisseId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { officiants, loading, error, refetch };
}
