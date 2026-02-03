import { useEffect, useState } from 'react';
import { getLiveStats, type LiveStats } from '@/lib/supabase/mediaQueries';

export default function useLiveStats(liveId?: string, pollInterval = 5000) {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timer: number | null = null;

    const load = async () => {
      if (!liveId) return;
      setLoading(true);
      try {
        const s = await getLiveStats(liveId);
        if (mounted) setStats(s);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    if (pollInterval > 0) {
      timer = window.setInterval(load, pollInterval);
    }

    return () => {
      mounted = false;
      if (timer) window.clearInterval(timer);
    };
  }, [liveId, pollInterval]);

  return { stats, loading } as const;
}
