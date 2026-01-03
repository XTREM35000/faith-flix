-- =====================================================
-- MIGRATION: Création de la table announcements
-- Gère les annonces paroissiales
-- =====================================================

-- 1. Créer la table announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contenu
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  
  -- Images/Médias
  image_url TEXT,
  
  -- Métadonnées
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 2. Créer les index
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON public.announcements(created_by);

-- 3. Activer RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements;
DROP POLICY IF EXISTS "Only admins can create announcements" ON public.announcements;
DROP POLICY IF EXISTS "Only admins can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Only admins can delete announcements" ON public.announcements;

-- 5. Politique de lecture pour tous
CREATE POLICY "Announcements are viewable by everyone"
  ON public.announcements
  FOR SELECT
  USING (true);

-- 6. Politique de création pour les admins
CREATE POLICY "Only admins can create announcements"
  ON public.announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  );

-- 7. Politique de mise à jour pour les admins
CREATE POLICY "Only admins can update announcements"
  ON public.announcements
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  );

-- 8. Politique de suppression pour les admins
CREATE POLICY "Only admins can delete announcements"
  ON public.announcements
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  );

-- 9. Créer un trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS announcements_updated_at_trigger ON public.announcements;
CREATE TRIGGER announcements_updated_at_trigger
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_announcements_updated_at();
