import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './useUser';

export function usePresence(userId?: string | null) {
  const { profile } = useUser();
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const intervalRef = useRef<number | null>(null);

  const fetchLastSeen = useCallback(async () => {
    if (!userId) return;
    // cast to any since profiles typing may not include 'last_seen_at' yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await supabase.from('profiles').select('last_seen_at').eq('id', userId).maybeSingle() as any;
    if (data && data.last_seen_at) setLastSeen(new Date(data.last_seen_at));
  }, [userId]);

  // Mark active (only allowed for the current logged-in user)
  const markActive = useCallback(async () => {
    if (!userId) return;

    // Only mark the profile as active if we're operating on *our* profile
    if (!profile || profile.id !== userId) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() } as any).eq('id', userId);
      setLastSeen(new Date());
    } catch (e) {
      console.warn('usePresence: markActive error', e);
    }
  }, [userId, profile]);

  useEffect(() => {
    fetchLastSeen();
    if (!userId) return;

    const channel = supabase
      .channel(`presence:profile:${userId}`)
      // NOTE: payload typing from Realtime is not strongly defined; allow any here
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, (payload: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payloadNew: any = payload.new;
        if (payloadNew?.last_seen_at) setLastSeen(new Date(payloadNew.last_seen_at));
      })
      .subscribe();

    // Only the current user should start a heartbeat to update their own last_seen_at
    const isSelf = !!profile && profile.id === userId;

    // Periodic heartbeat while mounted and visible (only if we're marking our own presence)
    const tick = () => {
      if (isSelf) markActive();
    };

    if (isSelf) {
      // Mark active immediately and start heartbeat
      markActive();
      intervalRef.current = window.setInterval(tick, 45 * 1000); // every 45s
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && isSelf) markActive();
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      supabase.removeChannel(channel);
    };
  }, [userId, fetchLastSeen, markActive, profile]);

  const isOnline = lastSeen !== null && (Date.now() - lastSeen.getTime()) < 2 * 60 * 1000; // 2 minutes

  return { lastSeen, isOnline, markActive };
}
