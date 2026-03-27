-- =====================================================
-- HOTFIX: RLS POLICIES CORRIGÉES POUR public.profiles
-- Correction des valeurs enum et suppression des boucles récursives
-- =====================================================

BEGIN;

-- Activer RLS sur la table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FONCTIONS D'AIDE (sans récursion)
-- =====================================================

-- Vérifier si un utilisateur est developer (hardcoded)
CREATE OR REPLACE FUNCTION public.is_developer(p_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_uid = '11111111-1111-1111-1111-111111111111'::uuid;
$$;

-- Vérifier si un utilisateur est admin ou super (via table admin_users)
CREATE OR REPLACE FUNCTION public.is_admin_or_super(p_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_developer(p_uid)
    OR EXISTS (
      SELECT 1 FROM public.admin_users au WHERE au.id = p_uid
    );
$$;

-- =====================================================
-- SUPPRIMER TOUTES LES POLICIES EXISTANTES
-- =====================================================
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
END $$;

-- =====================================================
-- CRÉER LES NOUVELLES POLICIES (avec les bonnes valeurs enum)
-- =====================================================

-- SELECT: utilisateur voit son propre profil, les profils non-developer sont publics,
--         et le developer voit tout
CREATE POLICY profiles_select_public_safe
  ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR role <> 'developer'::user_role
    OR public.is_developer()
  );

-- INSERT: l'utilisateur ne peut insérer que son propre profil
--         et ne peut pas s'auto-attribuer le rôle developer
CREATE POLICY profiles_insert_own_safe
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    (auth.uid() = id AND (role IS NULL OR role <> 'developer'::user_role))
    OR public.is_developer()
  );

-- UPDATE: auto-update autorisé, admin/super/developer peuvent tout modifier
CREATE POLICY profiles_update_safe
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR public.is_admin_or_super()
  )
  WITH CHECK (
    (auth.uid() = id AND (role IS NULL OR role <> 'developer'::user_role))
    OR public.is_admin_or_super()
  );

-- DELETE: seulement admin/super/developer, et ne peut pas supprimer le profil developer
CREATE POLICY profiles_delete_safe
  ON public.profiles
  FOR DELETE
  USING (
    public.is_admin_or_super()
    AND (role IS NULL OR role <> 'developer'::user_role)
  );

-- =====================================================
-- VÉRIFICATION DES POLICIES
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

COMMIT;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE '✅ RLS POLICIES CORRIGÉES AVEC SUCCÈS';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Valeurs enum user_role acceptées:';
  RAISE NOTICE '  - membre, moderateur, admin, super_admin, developer';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Policies créées:';
  RAISE NOTICE '  - profiles_select_public_safe';
  RAISE NOTICE '  - profiles_insert_own_safe';
  RAISE NOTICE '  - profiles_update_safe';
  RAISE NOTICE '  - profiles_delete_safe';
  RAISE NOTICE '==================================================';
END $$;