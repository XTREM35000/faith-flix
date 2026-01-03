-- =====================================================
-- MIGRATION: Dynamisation complète de la landing page
-- Table pour les sections éditables de la homepage
-- =====================================================

-- 1. Supprimer la table si elle existe (pour redémarrage propre)
DROP TABLE IF EXISTS public.homepage_sections CASCADE;

-- 2. Créer la table des sections de la homepage
CREATE TABLE public.homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key VARCHAR(50) UNIQUE NOT NULL,
  title TEXT,
  subtitle TEXT,
  content TEXT,
  image_url TEXT,
  button_text TEXT,
  button_link TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Créer les index
CREATE INDEX idx_homepage_sections_key ON public.homepage_sections(section_key);
CREATE INDEX idx_homepage_sections_active ON public.homepage_sections(is_active);

-- 4. Activer RLS
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- 5. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Homepage sections are viewable by everyone" ON public.homepage_sections;
DROP POLICY IF EXISTS "Only admins can insert homepage sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Only admins can update homepage sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Only admins can delete homepage sections" ON public.homepage_sections;

-- 6. Créer les politiques RLS
-- Tout le monde peut lire les sections actives
CREATE POLICY "Homepage sections are viewable by everyone"
  ON public.homepage_sections
  FOR SELECT
  TO public
  USING (is_active = TRUE);

-- Seuls les admins peuvent insérer
CREATE POLICY "Only admins can insert homepage sections"
  ON public.homepage_sections
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = auth.uid() 
      AND public.profiles.role IN ('admin', 'moderator')
    )
  );

-- Seuls les admins peuvent mettre à jour
CREATE POLICY "Only admins can update homepage sections"
  ON public.homepage_sections
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = auth.uid() 
      AND public.profiles.role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = auth.uid() 
      AND public.profiles.role IN ('admin', 'moderator')
    )
  );

-- Seuls les admins peuvent supprimer
CREATE POLICY "Only admins can delete homepage sections"
  ON public.homepage_sections
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = auth.uid() 
      AND public.profiles.role IN ('admin', 'moderator')
    )
  );

-- 7. Insérer les données par défaut (ou ne pas insérer si elles existent déjà)
INSERT INTO public.homepage_sections (section_key, title, subtitle, content, button_text, button_link, is_active, display_order)
SELECT * FROM (
  VALUES
  ('hero', 
   'Bienvenue à Notre Dame de la Compassion', 
   'Réveillon de la paroisse • 31 décembre à partir de 22h',
   'Une communauté vivante au cœur d''Abidjan, au service de la foi, de l''espérance et de la charité. Rejoignez-nous pour célébrer ensemble la Parole de Dieu.',
   'Voir les événements',
   '/evenements',
   TRUE,
   1
  ),
  ('gallery_section',
   'Galerie Photos',
   'Les moments forts de notre communauté',
   '{"limit": 4, "order": "recent"}',
   'Voir toutes les photos',
   '/galerie',
   TRUE,
   2
  ),
  ('videos_section',
   'Nos Vidéos',
   'Découvrez les messages inspirants et les célébrations de notre paroisse',
   '{"limit": 4, "order": "recent"}',
   'Voir toutes les vidéos',
   '/videos',
   TRUE,
   3
  ),
  ('events_section',
   'Événements à venir',
   'Restez connecté avec nos activités paroissiales',
   '{"limit": 2, "upcoming_only": true}',
   'Voir tous les événements',
   '/evenements',
   TRUE,
   4
  ),
  ('footer_mass_times',
   'Horaires des messes',
   NULL,
   '{"sunday": ["9h00", "11h00", "18h30"], "weekdays": ["8h00", "18h30"], "saturday": ["9h00", "18h00 (anticipée)"]}',
   NULL,
   NULL,
   TRUE,
   5
  ),
  ('footer_contact',
   'Contact',
   NULL,
   '{"address": "Boulevard de la Compassion, Abidjan, Côte d''Ivoire", "email": "compassionnotredame5@gmail.com", "moderator_phone": "0720035585", "super_admin_email": "basilediane71@gmail.com", "super_admin_phone": "0505263030"}',
   NULL,
   NULL,
   TRUE,
   6
  )
) AS data(section_key, title, subtitle, content, button_text, button_link, is_active, display_order)
ON CONFLICT (section_key) DO NOTHING;


-- =====================================================
-- RÉSUMÉ
-- ✅ Table homepage_sections créée avec RLS sécurisées
-- ✅ Sections par défaut insérées (idempotent avec ON CONFLICT)
-- ✅ Index pour performances
-- =====================================================
