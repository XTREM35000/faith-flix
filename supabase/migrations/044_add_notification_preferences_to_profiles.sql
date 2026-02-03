-- MIGRATION: Add notification_preferences JSONB to profiles (safe default + index)

-- 1) Add column if missing with a safe default (no spam default)
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT ('{"email": false, "push": false, "sms": false}')::jsonb;

-- 2) Backfill any existing NULL values (defensive)
UPDATE public.profiles
SET notification_preferences = ('{"email": false, "push": false, "sms": false}')::jsonb
WHERE notification_preferences IS NULL;

-- 3) Make column NOT NULL now that backfill is done
ALTER TABLE public.profiles
  ALTER COLUMN notification_preferences SET NOT NULL;

-- 4) Partial index to optimize queries that filter on opt-in push subscribers
CREATE INDEX IF NOT EXISTS idx_profiles_notify_push_true
  ON public.profiles ((notification_preferences->>'push'))
  WHERE (notification_preferences->>'push') = 'true';

-- 5) Comment for documentation
COMMENT ON COLUMN public.profiles.notification_preferences IS 'JSONB with keys: email, push, sms - user notification preferences';

-- ROLLBACK:
-- To rollback (carefully in production):
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS notification_preferences;
-- DROP INDEX IF EXISTS idx_profiles_notify_push_true;
