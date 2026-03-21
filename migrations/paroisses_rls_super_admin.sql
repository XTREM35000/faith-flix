-- À exécuter dans Supabase SQL Editor si ce n’est pas déjà fait.
-- Adaptez le nom de colonne rôle si besoin (ex. role vs user_role).

ALTER TABLE public.paroisses ENABLE ROW LEVEL SECURITY;

-- Lecture publique des paroisses actives (app visiteurs)
DROP POLICY IF EXISTS "Public read active paroisses" ON public.paroisses;
CREATE POLICY "Public read active paroisses"
  ON public.paroisses
  FOR SELECT
  USING (is_active = true);

-- Super admin : tout sur paroisses
DROP POLICY IF EXISTS "Super admin can manage paroisses" ON public.paroisses;
CREATE POLICY "Super admin can manage paroisses"
  ON public.paroisses
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE lower(role::text) = 'super_admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE lower(role::text) = 'super_admin'
    )
  );
