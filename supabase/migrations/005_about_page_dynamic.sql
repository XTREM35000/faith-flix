-- Migration: create about_page_sections table

CREATE TABLE IF NOT EXISTS about_page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key VARCHAR(50) UNIQUE NOT NULL,
  title TEXT,
  subtitle TEXT,
  content TEXT,
  content_type VARCHAR(20) DEFAULT 'text',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  image_url TEXT,
  icon VARCHAR(50),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Enable RLS and policies
ALTER TABLE about_page_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "About page sections are viewable by everyone"
  ON about_page_sections FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Only admins can manage about page sections"
  ON about_page_sections FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND lower(coalesce(profiles.role, '')) IN ('admin', 'super_admin')
    )
  );

-- Optional seed data (safe inserts)
INSERT INTO about_page_sections (section_key, title, subtitle, content, content_type, display_order, metadata)
VALUES
('about_hero', 'À propos de nous', 'Découvrez l\'histoire et la mission de notre paroisse', NULL, 'hero', 1,
 '{"buttons": [{"text": "Découvrir nos vidéos", "link": "/videos", "variant": "primary"}, {"text": "Voir les événements", "link": "/events", "variant": "secondary"}]}'),

('parish_description', 'Paroisse Notre-Dame de la Compassion', NULL, 'Notre paroisse est un lieu de foi, de communion et de service au cœur de notre communauté. Fondée sur les valeurs de l\'Évangile, nous accueillons tous ceux qui cherchent à grandir spirituellement et à servir le prochain.\n\nÀ travers nos services religieux, nos activités pastorales et nos engagements sociaux, nous aspirons à vivre l\'amour du Christ et à bâtir une communauté fraternelle et inclusive.', 'text', 2, NULL)
ON CONFLICT (section_key) DO NOTHING;