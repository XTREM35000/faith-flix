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

    const startTimer = () => {
      if (timer != null) window.clearInterval(timer);
      if (pollInterval <= 0 || !liveId) return;
      timer = window.setInterval(() => {
        if (!document.hidden) void load();
      }, pollInterval);
    };

    const onVisibility = () => {
      if (!document.hidden) void load();
      startTimer();
    };

    void load();
    startTimer();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', onVisibility);
      if (timer != null) window.clearInterval(timer);
    };
  }, [liveId, pollInterval]);

  return { stats, loading } as const;
}
