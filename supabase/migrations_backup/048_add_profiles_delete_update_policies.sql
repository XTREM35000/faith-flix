-- Migration 048: Add DELETE and UPDATE policies + RPC for profile management
-- CRITICAL: Only delete from profiles table, NEVER from auth.users (FK constraint)

-- First, drop any existing policies that might conflict
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP FUNCTION IF EXISTS delete_profile(UUID);

-- ADD DELETE POLICY: Admins can delete any profile via direct SQL
CREATE POLICY "profiles_delete_admin"
ON public.profiles
FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND (
    -- Allow deletion if the deleting user has admin or super_admin role
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'super_admin')
  )
);

-- ADD UPDATE POLICY: Admins can update any profile
CREATE POLICY "profiles_update_admin"
ON public.profiles
FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND (
    -- Allow update if the updating user has admin role
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    -- Allow update if the updating user has admin role
    (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'super_admin')
  )
);

-- Create RPC function to delete profile safely (admin only)
-- Uses SECURITY DEFINER to bypass RLS
-- IMPORTANT: Only deletes from profiles, auth.users will be cleaned up by auth system
CREATE OR REPLACE FUNCTION delete_profile(target_id UUID)
RETURNS void AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Get the role of the caller
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid() LIMIT 1;
  
  -- Check if caller is admin
  IF caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Only admins can delete profiles';
  END IF;
  
  -- Delete ONLY the profile record (CASCADE will clean up related records)
  -- DO NOT delete from auth.users - FK constraint will handle cleanup
  DELETE FROM profiles WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
