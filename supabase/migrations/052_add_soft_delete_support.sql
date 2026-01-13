-- Migration 052: Add soft delete support (RECOMMENDED approach)
-- Instead of actually deleting users, mark them as inactive
-- This avoids FK constraint issues and is better for data integrity

-- Add is_active column to profiles if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create a view for active profiles only (for backward compatibility)
DROP VIEW IF EXISTS active_profiles CASCADE;
CREATE VIEW active_profiles AS
SELECT * FROM profiles WHERE is_active = true;

-- Modify DELETE policy to do soft delete instead
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

-- Instead of DELETE, we UPDATE is_active = false
CREATE POLICY "profiles_delete_admin"
ON public.profiles
FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'super_admin')
);

-- Add UPDATE policy to mark as inactive (preferred method)
-- This is safer and doesn't violate FK constraints
CREATE POLICY "profiles_soft_delete_admin"
ON public.profiles
FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'super_admin')
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND (SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'super_admin')
);

-- Note: This migration recommends changing the DELETE to UPDATE is_active = false
-- in the application code instead of actually deleting profiles
