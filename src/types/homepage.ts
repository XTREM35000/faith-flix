// Types pour le contenu dynamique de la homepage
import { Database } from "@/integrations/supabase/types";

export interface HomepageSection {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: string | null; // JSON stringifié
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  display_order: number;
  is_active: boolean;
  updated_at: string;
  updated_by: string | null;
  created_at: string;
}

export interface HeroSectionData {
  title: string;
  subtitle: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  imageUrl?: string;
}

export interface GalleryDisplayData {
  limit: number;
  order: 'recent' | 'popular';
}

export interface VideoDisplayData {
  limit: number;
  order: 'recent' | 'popular';
}

export interface EventDisplayData {
  limit: number;
  upcoming_only: boolean;
}

export interface MassTimesData {
  sunday: string[];
  weekdays: string[];
  saturday: string[];
}

export interface ContactData {
  address: string;
  email: string;
  moderator_phone: string;
  super_admin_email?: string;
  super_admin_phone?: string;
}

// Type pour les images de galerie
export type GalleryImage = Database["public"]["Tables"]["gallery_images"]["Row"];

// Type pour les vidéos
export type Video = Database["public"]["Tables"]["videos"]["Row"];

// Type pour les événements
export type Event = Database["public"]["Tables"]["events"]["Row"];

export interface HomepageContentData {
  hero: HomepageSection | null;
  gallerySectionConfig: GalleryDisplayData | null;
  videosSectionConfig: VideoDisplayData | null;
  eventsSectionConfig: EventDisplayData | null;
  massTimes: MassTimesData | null;
  contact: ContactData | null;
  latestPhotos: GalleryImage[];
  latestVideos: Video[];
  upcomingEvents: Event[];
}
