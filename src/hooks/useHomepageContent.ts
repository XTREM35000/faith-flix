import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HomepageSection, HomepageContentData, MassTimesData, ContactData, GalleryDisplayData, VideoDisplayData, EventDisplayData } from '@/types/homepage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const homepageSectionsTable = 'homepage_sections' as any;

/**
 * Hook pour récupérer toutes les données dynamiques de la homepage
 * Combine les sections éditables avec les données des tables existantes
 */
export const useHomepageContent = () => {
  // Récupérer toutes les sections de la homepage
  const { data: sections = [], isLoading: sectionsLoading } = useQuery({
    queryKey: ['homepage-sections'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from(homepageSectionsTable) as any)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Erreur lors du chargement des sections:', error);
        return [];
      }

      return (data || []) as HomepageSection[];
    },
  });

  // Récupérer les 4 dernières photos de la galerie
  const { data: latestPhotos = [], isLoading: photosLoading } = useQuery({
    queryKey: ['homepage-gallery'],
    queryFn: async ({ signal }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try {
        // Check if signal is aborted before making request
        if (signal?.aborted) {
          return [];
        }

        const { data, error } = await (supabase.from('gallery_images') as any)
          .select('id, title, description, thumbnail_url, image_url, created_at')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(4);

        // Check again after async operation
        if (signal?.aborted) {
          return [];
        }

        if (error) {
          console.error('Erreur galerie:', error);
          return [];
        }

        return data || [];
      } catch (e: unknown) {
        // Ignore abort errors
        if (e && typeof e === 'object' && 'name' in e && e.name === 'AbortError') {
          console.log('Gallery query cancelled');
          return [];
        }
        console.error('Exception galerie:', e);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Récupérer les 4 dernières vidéos
  const { data: latestVideos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['homepage-videos'],
    queryFn: async ({ signal }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try {
        // Check if signal is aborted before making request
        if (signal?.aborted) {
          return [];
        }

        const { data, error } = await (supabase.from('videos') as any)
          .select('id, title, description, thumbnail_url, video_url, video_storage_path, views, created_at')
          .order('created_at', { ascending: false })
          .limit(4);

        // Check again after async operation
        if (signal?.aborted) {
          return [];
        }

        if (error) {
          // If a column is missing (42703), retry with a reduced selection
          if (error.code === '42703') {
            console.warn('videos: colonne manquante, retenter avec sélection réduite', error.message);
            const { data: reduced } = await (supabase.from('videos') as any)
              .select('id, title, description, thumbnail_url, created_at')
              .order('created_at', { ascending: false })
              .limit(4);
            return reduced || [];
          }
          console.error('Erreur vidéos:', error);
          return [];
        }

        return data || [];
      } catch (e: unknown) {
        // Ignore abort errors
        if (e && typeof e === 'object' && 'name' in e && e.name === 'AbortError') {
          console.log('Videos query cancelled');
          return [];
        }
        console.error('Exception vidéos:', e);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Récupérer les 2 derniers événements (créés ou à venir)
  const { data: upcomingEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['homepage-events'],
    queryFn: async ({ signal }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try {
        // Check if signal is aborted before making request
        if (signal?.aborted) {
          return [];
        }

        const { data, error } = await (supabase.from('events') as any)
          .select('id, title, description, start_date, end_date, location, image_url')
          .order('created_at', { ascending: false })
          .limit(2);

        // Check again after async operation
        if (signal?.aborted) {
          return [];
        }

        if (error) {
          if (error.code === '42703') {
            console.warn('events: colonne manquante, retenter avec sélection réduite', error.message);
            const { data: reduced } = await (supabase.from('events') as any)
              .select('id, title, description, start_date, location')
              .order('created_at', { ascending: false })
              .limit(2);
            return reduced || [];
          }
          console.error('Erreur événements:', error);
          return [];
        }

        return data || [];
      } catch (e: unknown) {
        // Ignore abort errors
        if (e && typeof e === 'object' && 'name' in e && e.name === 'AbortError') {
          console.log('Events query cancelled');
          return [];
        }
        console.error('Exception événements:', e);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Extraire et parser les sections spécifiques
  const heroSection = sections.find((s) => s.section_key === 'hero') || null;
  const gallerySectionConfig = sections.find((s) => s.section_key === 'gallery_section');
  const videosSectionConfig = sections.find((s) => s.section_key === 'videos_section');
  const eventsSectionConfig = sections.find((s) => s.section_key === 'events_section');
  const massTimesSection = sections.find((s) => s.section_key === 'footer_mass_times');
  const contactSection = sections.find((s) => s.section_key === 'footer_contact');

  // Parser le contenu JSON des sections
  const parsedMassTimes: MassTimesData | null = massTimesSection?.content
    ? (JSON.parse(massTimesSection.content) as MassTimesData)
    : null;

  const parsedContact: ContactData | null = contactSection?.content
    ? (JSON.parse(contactSection.content) as ContactData)
    : null;

  const parsedGalleryConfig: GalleryDisplayData | null = gallerySectionConfig?.content
    ? (JSON.parse(gallerySectionConfig.content) as GalleryDisplayData)
    : { limit: 4, order: 'recent' };

  const parsedVideosConfig: VideoDisplayData | null = videosSectionConfig?.content
    ? (JSON.parse(videosSectionConfig.content) as VideoDisplayData)
    : { limit: 4, order: 'recent' };

  const parsedEventsConfig: EventDisplayData | null = eventsSectionConfig?.content
    ? (JSON.parse(eventsSectionConfig.content) as EventDisplayData)
    : { limit: 2, upcoming_only: true };

  const isLoading = sectionsLoading || photosLoading || videosLoading || eventsLoading;

  return {
    sections,
    hero: heroSection,
    gallerySectionConfig: parsedGalleryConfig,
    videosSectionConfig: parsedVideosConfig,
    eventsSectionConfig: parsedEventsConfig,
    massTimes: parsedMassTimes,
    contact: parsedContact,
    latestPhotos,
    latestVideos,
    upcomingEvents,
    isLoading,
  } as HomepageContentData & {
    sections: HomepageSection[];
    isLoading: boolean;
  };
};
