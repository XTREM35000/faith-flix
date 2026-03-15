-- Migration: Fix update_profile_role RPC to properly handle super_admin role
-- The previous version incorrectly mapped super_admin to admin

-- Drop the existing function
DROP FUNCTION IF EXISTS public.update_profile_role(uuid, text);

-- Recreate with correct super_admin handling
CREATE FUNCTION public.update_profile_role(target_id uuid, new_role text)
RETURNS TABLE(profile_id uuid, role text) AS $$
BEGIN
  -- validate role
  IF new_role IS NULL THEN
    RAISE EXCEPTION 'new_role must be provided';
  END IF;
  IF lower(new_role) NOT IN (
    'member','membre',
    'moderator','moderateur',
    'admin','administrateur',
    'pretre','diacre',
    'super_admin','superadmin','super-admin'
  ) THEN
    RAISE EXCEPTION 'invalid role: %', new_role;
  END IF;

  -- Check caller is admin or super_admin according to profiles table
  IF NOT EXISTS(
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
  ) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  -- Normalize common aliases into the French canonical values used by the profiles table
  new_role := lower(new_role);
  IF new_role IN ('member','membre') THEN
    new_role := 'membre';
  ELSIF new_role IN ('moderator','moderateur') THEN
    new_role := 'moderateur';
  ELSIF new_role IN ('admin','administrateur') THEN
    new_role := 'admin';
  ELSIF new_role = 'pretre' THEN
    new_role := 'pretre';
  ELSIF new_role = 'diacre' THEN
    new_role := 'diacre';
  ELSIF new_role IN ('superadmin','super-admin','super_admin') THEN
    -- Keep super_admin as super_admin (fixed bug where it was mapped to admin)
    new_role := 'super_admin';
  END IF;

  -- Perform the update
  UPDATE public.profiles
  SET role = new_role,
    updated_at = timezone('utc', now())
  WHERE id = target_id;

  -- Return the updated row explicitly to avoid ambiguous column references
  IF FOUND THEN
    RETURN QUERY
    SELECT p.id AS profile_id, p.role AS role
    FROM public.profiles p
    WHERE p.id = target_id;
  ELSE
    RAISE EXCEPTION 'profile not found';
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated role so clients can call the RPC (the function itself enforces admin check)
GRANT EXECUTE ON FUNCTION public.update_profile_role(uuid, text) TO authenticated;

-- Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "super_admin_can_update_all" ON public.profiles;
DROP POLICY IF EXISTS "admin_can_update_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_can_read_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;

-- Policy for super_admin to update all profiles
CREATE POLICY "super_admin_can_update_all" ON public.profiles
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'super_admin'
    )
  );

-- Policy for admin to update profiles (except super_admin)
CREATE POLICY "admin_can_update_profiles" ON public.profiles
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    ) AND role != 'super_admin'
  );

-- Policy for users to read all profiles
CREATE POLICY "users_can_read_profiles" ON public.profiles
  FOR SELECT USING (true);

-- Policy for users to update their own profile
CREATE POLICY "users_can_update_own_profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);