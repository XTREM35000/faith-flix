export interface ReligiousFeast {
  id: string;
  name: string;
  description: string | null;
  date: string;
  feast_type: 'fixed' | 'movable' | null;
  liturgy_color: string | null;
  gospel_reference: string | null;
  homily_id: string | null;
  prayer_text: string | null;
  reflection_text: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeastPrayerIntention {
  id: string;
  feast_id: string;
  user_id: string;
  intention: string;
  is_public: boolean;
  is_pinned: boolean;
  created_at: string;
}
