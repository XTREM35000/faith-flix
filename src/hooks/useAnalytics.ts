import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Video {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  views?: number | null;
  thumbnail_url?: string | null;
  duration?: number | null;
  created_at?: string | null;
}

export interface AnalyticsDashboardData {
  totalViews: number;
  weeklyViews: { day: string; views: number }[];
  categoryDistribution: { name: string; value: number }[];
  topVideos: Video[];
  engagementTrend: { day: string; views: number; engagement: number }[];
}

const fetchAnalyticsData = async (): Promise<AnalyticsDashboardData> => {
  // Fetch all videos
  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('*')
    .order('views', { ascending: false });

  if (videosError) throw videosError;

  const allVideos: Video[] = videos || [];

  // Calculate total views
  const totalViews = allVideos.reduce((sum: number, v: Video) => sum + (v.views || 0), 0);

  // Generate weekly views (simulated based on total)
  const weeklyViews = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayName = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()];
    // Distribute views throughout the week with some variation
    const dayViews = Math.floor((totalViews / 7) * (0.7 + Math.random() * 0.6));
    return { day: dayName, views: dayViews };
  });

  // Calculate category distribution
  const categoryDistribution: { name: string; value: number }[] = [];
  const categoryMap = new Map<string, number>();

  allVideos.forEach((v: Video) => {
    const cat = v.category || 'Autres';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + (v.views || 1));
  });

  Array.from(categoryMap.entries()).forEach(([name, value]) => {
    categoryDistribution.push({ name, value });
  });

  // Sort by value descending
  categoryDistribution.sort((a, b) => b.value - a.value);

  return {
    totalViews,
    weeklyViews,
    categoryDistribution: categoryDistribution.length > 0 
      ? categoryDistribution 
      : [
          { name: 'Sermon', value: 45 },
          { name: 'Musique', value: 25 },
          { name: 'Enseignement', value: 20 },
          { name: 'Célébration', value: 10 },
        ],
    topVideos: allVideos.slice(0, 6),
    engagementTrend: Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayName = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()];
      const views = Math.floor((totalViews / 7) * (0.7 + Math.random() * 0.6));
      return {
        day: dayName,
        views,
        engagement: Math.round(views * (0.5 + Math.random() * 0.5))
      };
    })
  };
};

export function useAnalyticsDashboard() {
  return useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => fetchAnalyticsData(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
