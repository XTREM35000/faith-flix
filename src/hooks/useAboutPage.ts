import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface AboutSection {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  content_type: 'text' | 'list' | 'cards' | 'contact' | 'hero' | 'cta' | 'mission';
  metadata: any;
  image_url: string | null;
  icon: string | null;
  display_order: number;
}

export const useAboutPage = () => {
  return useQuery({
    queryKey: ['about-page'],
    queryFn: async (): Promise<AboutSection[]> => {
      const { data, error } = await supabase
        .from('about_page_sections')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data as AboutSection[]) || [];
    },
  });
};

export const organizeAboutSections = (sections: AboutSection[]) => {
  return {
    hero: sections.find((s) => s.section_key === 'about_hero') || null,
    description: sections.find((s) => s.section_key === 'parish_description') || null,
    mission: sections.find((s) => s.section_key === 'our_mission') || null,
    values: sections.find((s) => s.section_key === 'our_values') || null,
    ministries: sections.find((s) => s.section_key === 'our_ministries') || null,
    contact: sections.find((s) => s.section_key === 'contact_info') || null,
    cta: sections.find((s) => s.section_key === 'contact_cta') || null,
  };
};
