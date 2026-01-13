-- Migration 049: Simpler approach - Direct RLS policies for DELETE (admin roles only)
-- This removes the complex RPC and uses simple direct policies

-- Drop the RPC function if it was created
DROP FUNCTION IF EXISTS delete_profile(UUID);

-- Ensure the previous policies exist or recreate them more robustly
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

-- Simple DELETE policy: admins can delete any profile
CREATE POLICY profiles_delete_admin
ON public.profiles
FOR DELETE
USING (
  -- Must be authenticated
  auth.role() = 'authenticated'
  -- AND user must be admin (check role in profiles table)
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Simple UPDATE policy: admins can update any profile
CREATE POLICY profiles_update_admin
ON public.profiles
FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
