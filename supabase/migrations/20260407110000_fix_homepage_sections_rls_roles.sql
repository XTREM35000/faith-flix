-- Fix RLS for homepage_sections so admin roles can edit homepage tabs.

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can insert homepage sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Only admins can update homepage sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Only admins can delete homepage sections" ON public.homepage_sections;

-- Fonction helper pour vérifier les rôles admin
CREATE OR REPLACE FUNCTION public.is_admin_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role::text IN ('admin', 'super_admin', 'moderator', 'developer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politiques simplifiées
CREATE POLICY "Admins can manage homepage sections"
  ON public.homepage_sections
  USING (public.is_admin_role());

CREATE POLICY "Admins can insert homepage sections"
  ON public.homepage_sections
  FOR INSERT
  WITH CHECK (public.is_admin_role());

CREATE POLICY "Admins can update homepage sections"
  ON public.homepage_sections
  FOR UPDATE
  USING (public.is_admin_role());

CREATE POLICY "Admins can delete homepage sections"
  ON public.homepage_sections
  FOR DELETE
  USING (public.is_admin_role());