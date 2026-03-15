import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardData {
  totalVideos: number;
  totalEvents: number;
  totalMessages: number;
  pendingComments: number;
  totalDonations: number;
  totalUsers: number;
  activeUsersToday: number;
  retentionRate: number;
  recentVideos: Array<{ id: string; title: string; created_at: string }>;
  upcomingEvents: Array<{ id: string; title: string; event_date: string }>;
  recentComments: Array<{ id: string; content: string; status: string; created_at: string }>;
}

interface UseAdminDashboardDataResult {
  data: DashboardData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useAdminDashboardData = (): UseAdminDashboardDataResult => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Récupérer les données en parallèle (vraies données Supabase)
      const [
        videosRes,
        eventsRes,
        donationsRes,
        usersRes,
        activeUsersRes,
        messagesCountRes,
        pendingNotificationsRes,
      ] = await Promise.all([
        supabase
          .from('videos')
          .select('id, title, created_at', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('events')
          .select('id, title, event_date', { count: 'exact' })
          .order('event_date', { ascending: false })
          .limit(5),
        supabase
          .from('donations')
          .select('amount, created_at, payment_status', { count: 'exact' })
          .eq('payment_status', 'completed')
          .gte('created_at', monthStart.toISOString()),
        supabase
          .from('profiles')
          .select('id', { count: 'exact' }),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('last_seen', todayStart.toISOString()),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .is('read_at', null),
      ]);

      // Calculer les donations du mois (réelles)
      let totalDonations = 0;
      if (donationsRes.data) {
        totalDonations = donationsRes.data.reduce(
          (sum: number, d: { amount: number | null }) => sum + (Number(d.amount) || 0),
          0,
        );
      }

      const totalUsers = usersRes.count || 0;
      const activeUsersToday = activeUsersRes.count || 0;
      const retentionRate =
        totalUsers > 0 ? (activeUsersToday / totalUsers) * 100 : 0;

      setData({
        totalVideos: videosRes.count || 0,
        totalEvents: eventsRes.count || 0,
        totalMessages: messagesCountRes.count || 0,
        pendingComments: pendingNotificationsRes.count || 0,
        totalDonations,
        totalUsers,
        activeUsersToday,
        retentionRate,
        recentVideos: videosRes.data?.map(v => ({ id: v.id, title: v.title, created_at: v.created_at })) || [],
        upcomingEvents: eventsRes.data?.map(e => ({ id: e.id, title: e.title, event_date: e.event_date })) || [],
        recentComments: [],
      });
    } catch (err) {
      console.error('[useAdminDashboardData] Error:', err);
      setError(err instanceof Error ? err : new Error('Erreur lors du chargement'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = async () => {
    await fetchData();
  };

  return { data, loading, error, refetch };
};

export default useAdminDashboardData;
