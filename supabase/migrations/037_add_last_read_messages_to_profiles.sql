-- MIGRATION: add last_read_messages_at to profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_read_messages_at TIMESTAMPTZ;

-- No RLS changes required; profiles already has RLS policies allowing users to update their own profile.

-- Backfill: set to NOW() for existing admin users to avoid large unread counts (optional)
-- UPDATE public.profiles SET last_read_messages_at = NOW() WHERE role IN ('admin','super_admin');
