-- Migration 050: FINAL FIX - Simple DELETE policy for admin profiles
-- No RPC, no complexity - just allow admins to delete profiles directly

-- Drop conflicting policies
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP FUNCTION IF EXISTS delete_profile(UUID);

-- Simple policy: Check if user is admin in JWT claims
-- This is the most reliable way with Supabase
CREATE POLICY profiles_delete_admin
ON public.profiles
FOR DELETE
USING (
  -- Must be authenticated
  auth.role() = 'authenticated'
  -- User must have admin role in their profile
  AND (
    -- Get user's role from their own profile
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'super_admin')
  )
);

-- Update policy for admins
CREATE POLICY profiles_update_admin
ON public.profiles
FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'super_admin')
  )
);
