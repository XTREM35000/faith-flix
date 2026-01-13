-- Migration 051: Fix FK constraint issues on homepage_sections
-- Change updated_by FK to SET NULL on delete instead of RESTRICT

-- Drop the constraint
ALTER TABLE public.homepage_sections 
DROP CONSTRAINT IF EXISTS homepage_sections_updated_by_fkey;

-- Recreate with ON DELETE SET NULL
ALTER TABLE public.homepage_sections
ADD CONSTRAINT homepage_sections_updated_by_fkey
FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Also check and fix other tables that might reference auth.users
-- For gallery_images
ALTER TABLE public.gallery_images 
DROP CONSTRAINT IF EXISTS gallery_images_user_id_fkey;

ALTER TABLE public.gallery_images
ADD CONSTRAINT gallery_images_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- For videos
ALTER TABLE public.videos
DROP CONSTRAINT IF EXISTS videos_user_id_fkey;

ALTER TABLE public.videos
ADD CONSTRAINT videos_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- For messages
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

ALTER TABLE public.messages
ADD CONSTRAINT messages_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- For announcements
ALTER TABLE public.announcements
DROP CONSTRAINT IF EXISTS announcements_created_by_fkey;

ALTER TABLE public.announcements
ADD CONSTRAINT announcements_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
