-- =====================================================
-- MIGRATION: Création/Amélioration de la table announcements
-- Gère les annonces paroissiales (version idempotente)
-- =====================================================

-- 1. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 2. Ajouter les colonnes manquantes (si la table existait déjà sans certaines colonnes)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'created_by') THEN
        ALTER TABLE public.announcements ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'updated_at') THEN
        ALTER TABLE public.announcements ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'is_active') THEN
        ALTER TABLE public.announcements ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 3. Créer les index de manière sécurisée
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON public.announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active);

-- 4. Activer RLS (si pas déjà fait)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 5. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements;
DROP POLICY IF EXISTS "Only admins can create announcements" ON public.announcements;
DROP POLICY IF EXISTS "Only admins can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Only admins can delete announcements" ON public.announcements;

-- 6. Politique de lecture pour tous
CREATE POLICY "Announcements are viewable by everyone"
  ON public.announcements
  FOR SELECT
  USING (true);

-- 7. Politique de création pour les admins
CREATE POLICY "Only admins can create announcements"
  ON public.announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'administrateur'))
  );

-- 8. Politique de mise à jour pour les admins
CREATE POLICY "Only admins can update announcements"
  ON public.announcements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'administrateur'))
  );

-- 9. Politique de suppression pour les admins
CREATE POLICY "Only admins can delete announcements"
  ON public.announcements
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'administrateur'))
  );

-- 10. Trigger pour updated_at
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