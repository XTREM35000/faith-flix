import { supabase } from '../integrations/supabase/client';
import type { Json } from '../integrations/supabase/types';
import { useQuery } from '@tanstack/react-query';
import { useUser } from './useUser';

export interface AboutSection {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  content_type: string | null;
  metadata: Json | null;
  image_url: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  updated_at: string;
}

export const useAboutPage = () => {
  const { profile } = useUser();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'administrateur';

  return useQuery({
    queryKey: ['about-page'],
    queryFn: async (): Promise<AboutSection[]> => {
      const { data, error } = await supabase
        .from('about_page_sections')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching about page sections:', error);
        throw error;
      }
      console.log('About page sections fetched:', data, '(isAdmin:', isAdmin, ')');
      return data || [];
    },
    // Force refetch when cache is invalidated
    staleTime: 0,
    gcTime: 0, // Previously cacheTime
  });
};

export const organizeAboutSections = (sections: AboutSection[]) => {
  return {
    hero: sections.find(s => s.section_key === 'about_hero'),
    description: sections.find(s => s.section_key === 'parish_description'),
    mission: sections.find(s => s.section_key === 'our_mission'),
    values: sections.find(s => s.section_key === 'our_values'),
    ministries: sections.find(s => s.section_key === 'our_ministries'),
    contact: sections.find(s => s.section_key === 'contact_info'),
    cta: sections.find(s => s.section_key === 'contact_cta')
  };
};
