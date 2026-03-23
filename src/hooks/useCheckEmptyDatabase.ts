import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCheckEmptyDatabase = () => {
  const [isEmpty, setIsEmpty] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkDatabase = async () => {
      try {
        const { count: paroisseCount, error: paroisseError } = await supabase
          .from('paroisses')
          .select('*', { count: 'exact', head: true });

        if (paroisseError) throw paroisseError;

        const { count: profileCount, error: profileError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (profileError) throw profileError;

        if (!mounted) return;

        setIsEmpty((paroisseCount ?? 0) === 0 && (profileCount ?? 0) === 0);
        setError(null);
      } catch (err) {
        console.error('Erreur vérification base:', err);
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsEmpty(false);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    void checkDatabase();

    return () => {
      mounted = false;
    };
  }, []);

  return { isEmpty, loading, error } as const;
};
