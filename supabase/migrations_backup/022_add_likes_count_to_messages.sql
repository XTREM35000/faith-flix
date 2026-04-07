-- Migration: add likes_count column to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;

-- Ensure existing rows have a value
UPDATE public.messages SET likes_count = 0 WHERE likes_count IS NULL;

-- Optional index for fast reads
CREATE INDEX IF NOT EXISTS idx_messages_likes_count ON public.messages(likes_count);

-- If RLS policies exist, ensure authenticated users can update their likes via existing policies
-- (Assumes policies on messages allow authenticated update; adjust if necessary)
