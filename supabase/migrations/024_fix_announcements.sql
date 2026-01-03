-- =====================================================
-- MIGRATION: Correction de la table announcements
-- Ajoute la colonne is_active et corrige les RLS policies
-- =====================================================

-- 1. Ajouter la colonne is_active si elle n'existe pas
ALTER TABLE IF EXISTS public.announcements
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements;
DROP POLICY IF EXISTS "Only admins can create announcements" ON public.announcements;
DROP POLICY IF EXISTS "Only admins can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Only admins can delete announcements" ON public.announcements;

-- 3. Créer une politique simple de lecture (public)
CREATE POLICY "Announcements are viewable by everyone"
  ON public.announcements
  FOR SELECT
  USING (true);

-- 4. Créer une politique pour les admins authentifiés
-- Utilise le profil pour vérifier le rôle
CREATE POLICY "Authenticated users can create announcements if admin"
  ON public.announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  );

-- 5. Politique de mise à jour pour les admins
CREATE POLICY "Authenticated users can update announcements if admin"
  ON public.announcements
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  );

-- 6. Politique de suppression pour les admins
CREATE POLICY "Authenticated users can delete announcements if admin"
  ON public.announcements
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  );
