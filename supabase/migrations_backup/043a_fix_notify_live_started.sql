-- MIGRATION: Make notify_live_started safe when profiles.notification_preferences is missing

-- Replace the trigger function with a defensive version that checks for the column
CREATE OR REPLACE FUNCTION public.notify_live_started()
RETURNS trigger AS $$
DECLARE
  has_col boolean;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.is_active = true AND OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    -- Check if column exists to avoid errors on older schemas
    SELECT EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'notification_preferences'
    ) INTO has_col;

    IF has_col THEN
      INSERT INTO public.notifications (user_id, title, body, metadata, created_at)
      SELECT id, 'Un direct démarre : ' || NEW.title, 'Cliquez pour regarder le direct', jsonb_build_object('live_id', NEW.id), now()
      FROM public.profiles
      WHERE COALESCE((notification_preferences->>'push')::boolean, false) = true
        AND COALESCE(is_active, true) = true;
    ELSE
      -- Column missing: fallback safe behavior — do not fail the update
      RAISE NOTICE 'notify_live_started: profiles.notification_preferences column missing, skipping notification insert';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to ensure it's using the latest function
DROP TRIGGER IF EXISTS trg_live_notify_started ON public.live_streams;
CREATE TRIGGER trg_live_notify_started
AFTER UPDATE ON public.live_streams
FOR EACH ROW
EXECUTE FUNCTION public.notify_live_started();

-- ROLLBACK:
-- To rollback, you can restore the previous function body or drop the trigger and function if necessary.
-- DROP TRIGGER IF EXISTS trg_live_notify_started ON public.live_streams;
-- DROP FUNCTION IF EXISTS public.notify_live_started();
