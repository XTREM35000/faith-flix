-- Diagnostic: Check current RLS state and policies on profiles table
-- Run this in Supabase SQL editor to diagnose

-- Check if RLS is enabled on profiles
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Check all policies on profiles table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check if delete_profile function exists
SELECT
  n.nspname,
  p.proname,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'delete_profile' AND n.nspname = 'public';
