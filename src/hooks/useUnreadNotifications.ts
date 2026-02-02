import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './useUser';

export const useUnreadNotifications = () => {
  const { profile } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile?.id) {
      setUnreadCount(0);
      return;
    }

    console.log('[useUnreadNotifications] Initializing for profile:', profile.id);

    // Load initial count
    const loadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('is_read', false);

        if (error) throw error;
        console.log('[useUnreadNotifications] Initial count:', count);
        setUnreadCount(count || 0);
      } catch (e) {
        console.error('[useUnreadNotifications] load error', e);
      }
    };

    loadCount();

    // Subscribe to realtime changes on notifications table (NO FILTER - filter manually)
    let channel: any = null;
    try {
      channel = supabase
        .channel(`public:notifications:user_${profile.id}`)
        .on('postgres_changes', 
          { 
            event: '*',  // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public', 
            table: 'notifications'
          }, 
          (payload: any) => {
            console.log('[useUnreadNotifications] Realtime event received:', payload.eventType, 'new:', payload.new, 'old:', payload.old);
            
            // Filter manually: only react to events for THIS user
            const isForThisUser = (payload.new?.user_id === profile.id) || (payload.old?.user_id === profile.id);
            
            if (!isForThisUser) {
              console.log('[useUnreadNotifications] Event is not for this user, ignoring');
              return;
            }

            // Reload the count whenever there's a change for this user
            (async () => {
              try {
                const { count, error } = await supabase
                  .from('notifications')
                  .select('id', { count: 'exact', head: true })
                  .eq('user_id', profile.id)
                  .eq('is_read', false);

                if (error) throw error;
                console.log('[useUnreadNotifications] Updated count after realtime event:', count);
                setUnreadCount(count || 0);
              } catch (e) {
                console.error('[useUnreadNotifications] realtime count error', e);
              }
            })();
          }
        );

      // attempt to subscribe and handle potential errors
      const subRes = channel.subscribe();
      // If subscription returns a status or throws, handle it
      if (subRes && typeof subRes.then === 'function') {
        subRes.catch((err: any) => {
          console.warn('[useUnreadNotifications] Realtime subscribe failed, falling back to polling:', err);
          // fallthrough to polling fallback
        });
      }
    } catch (e) {
      console.warn('[useUnreadNotifications] Failed to set up realtime subscription, falling back to polling:', e);
    }

    // Polling fallback in case realtime is unavailable
    let pollingInterval: number | null = null;
    if (!channel) {
      pollingInterval = window.setInterval(async () => {
        try {
          const { count, error } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .eq('is_read', false);

          if (error) {
            console.warn('[useUnreadNotifications] Polling error', error);
            return;
          }

          setUnreadCount(count || 0);
        } catch (err) {
          console.error('[useUnreadNotifications] Polling unexpected error', err);
        }
      }, 30 * 1000); // every 30s
    }

    return () => {
      console.log('[useUnreadNotifications] Cleanup: removing channel');
      try {
        if (channel) supabase.removeChannel(channel);
        if (pollingInterval) window.clearInterval(pollingInterval);
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, [profile?.id]);

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    if (!profile?.id) return;
    try {
      console.log('[useUnreadNotifications] Marking all as read for user:', profile.id);
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);

      if (error) {
        console.error('[useUnreadNotifications] Error marking all as read:', error);
        return;
      }

      console.log('[useUnreadNotifications] Successfully marked all as read');
      // Reset count immediately
      setUnreadCount(0);
    } catch (error) {
      console.error('[useUnreadNotifications] Unexpected error:', error);
    }
  };

  return { unreadCount, markAllAsRead };
};

export default useUnreadNotifications;
