-- Migration 050: FINAL - Enable admin deletion on profiles (ensure policies work)
-- This is the definitive fix for admin deletion

-- Ensure RLS is enabled on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove ALL conflicting policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS profiles_delete_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
DROP POLICY IF EXISTS profiles_update_all ON public.profiles;

-- === RECREATE ALL POLICIES FROM SCRATCH ===

-- 1. SELECT: Everyone can see all profiles
CREATE POLICY "profiles_select_all"
ON public.profiles
FOR SELECT
USING (true);

-- 2. UPDATE: Users can update their own profile OR admins can update any profile
CREATE POLICY "profiles_update_self_or_admin"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id
  OR (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  )
)
WITH CHECK (
  auth.uid() = id
  OR (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  )
);

-- 3. DELETE: Only admins can delete profiles
CREATE POLICY "profiles_delete_admin_only"
ON public.profiles
FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('admin', 'super_admin')
  )
);

-- Verify policies are created
-- SELECT policyname, permissive FROM pg_policies WHERE tablename = 'profiles';
