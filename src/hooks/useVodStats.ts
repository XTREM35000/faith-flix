import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VodStats {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalWatchTime: number;
  topVideos: Array<{ id: string; title: string; views_count: number }>;
}

export default function useVodStats(days = 30) {
  const [stats, setStats] = useState<VodStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from("videos")
          .select("id, title, views_count, likes_count, created_at", { count: "exact" })
          .gte("created_at", since);

        if (error) throw error;

        const totalVideos = data?.length ?? 0;
        const totalViews = data?.reduce((sum, v) => sum + (v.views_count ?? 0), 0) ?? 0;
        const totalLikes = data?.reduce((sum, v) => sum + (v.likes_count ?? 0), 0) ?? 0;

        const topVideos =
          data
            ?.slice()
            .sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0))
            .slice(0, 10)
            .map((v) => ({
              id: v.id,
              title: v.title,
              views_count: v.views_count ?? 0,
            })) ?? [];

        if (mounted) {
          setStats({
            totalVideos,
            totalViews,
            totalLikes,
            totalWatchTime: 0,
            topVideos,
          });
        }
      } catch {
        if (mounted) setStats(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [days]);

  return { stats, loading } as const;
}

