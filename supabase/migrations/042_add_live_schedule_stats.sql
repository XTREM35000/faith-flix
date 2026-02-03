-- MIGRATION: Add scheduling, stats, RPC and triggers for live streams

-- 1) Add columns to live_streams
ALTER TABLE IF EXISTS public.live_streams
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS replay_created boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_live_streams_scheduled_at ON public.live_streams(scheduled_at);

-- 2) Create live_stats table
CREATE TABLE IF NOT EXISTS public.live_stats (
  live_id uuid PRIMARY KEY REFERENCES public.live_streams(id) ON DELETE CASCADE,
  viewers_count integer NOT NULL DEFAULT 0,
  peak_viewers integer NOT NULL DEFAULT 0,
  total_views bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) RPC to increment/decrement viewers in an atomic way
CREATE OR REPLACE FUNCTION public.rpc_increment_viewer(p_live_id uuid, p_delta integer, p_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  live_id uuid,
  viewers_count integer,
  peak_viewers integer,
  total_views bigint,
  updated_at timestamptz
) AS $$
BEGIN
  INSERT INTO public.live_stats (live_id, viewers_count, peak_viewers, total_views)
  VALUES (p_live_id, GREATEST(p_delta,0), GREATEST(p_delta,0), GREATEST(p_delta,0))
  ON CONFLICT (live_id) DO UPDATE
  SET
    viewers_count = GREATEST(public.live_stats.viewers_count + GREATEST(p_delta, -1 * public.live_stats.viewers_count), 0),
    peak_viewers = GREATEST(GREATEST(public.live_stats.viewers_count + p_delta, 0), public.live_stats.peak_viewers),
    total_views = public.live_stats.total_views + (CASE WHEN p_delta > 0 THEN p_delta ELSE 0 END),
    updated_at = now()
  RETURNING public.live_stats.live_id, public.live_stats.viewers_count, public.live_stats.peak_viewers, public.live_stats.total_views, public.live_stats.updated_at
  INTO live_id, viewers_count, peak_viewers, total_views, updated_at;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Activation function to set scheduled lives active
CREATE OR REPLACE FUNCTION public.activate_scheduled_live()
RETURNS void AS $$
BEGIN
  -- Activate scheduled ones
  UPDATE public.live_streams
  SET is_active = true
  WHERE scheduled_at IS NOT NULL AND scheduled_at <= now() AND is_active = false;

  -- Deactivate others (business rule: only scheduled ones active)
  UPDATE public.live_streams
  SET is_active = false
  WHERE is_active = true AND NOT (scheduled_at IS NOT NULL AND scheduled_at <= now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: If pg_cron is available, schedule this function every minute (uncomment to use)
-- SELECT cron.schedule('activate_scheduled_live_every_minute', '*/1 * * * *', $$SELECT public.activate_scheduled_live();$$);

-- 5) Trigger to notify users when live starts
CREATE OR REPLACE FUNCTION public.notify_live_started()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.is_active = true AND OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    -- Insert notifications for users who opted-in (push = true and active)
    INSERT INTO public.notifications (user_id, title, body, metadata, created_at)
    SELECT id, 'Un direct démarre : ' || NEW.title, 'Cliquez pour regarder le direct', jsonb_build_object('live_id', NEW.id), now()
    FROM public.profiles
    WHERE COALESCE((notification_preferences->>'push')::boolean, false) = true
      AND COALESCE(is_active, true) = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_live_notify_started ON public.live_streams;
CREATE TRIGGER trg_live_notify_started
AFTER UPDATE ON public.live_streams
FOR EACH ROW
EXECUTE FUNCTION public.notify_live_started();

-- 6) Replay queue + trigger to create replay task when live ends (idempotent)
CREATE TABLE IF NOT EXISTS public.replay_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  payload jsonb DEFAULT '{}',
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.create_replay_on_end()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false AND NEW.replay_created = false THEN
    -- ensure queue entry exists
    IF NOT EXISTS (SELECT 1 FROM public.replay_queue WHERE live_stream_id = NEW.id AND processed = false) THEN
      INSERT INTO public.replay_queue (live_stream_id, payload) VALUES (NEW.id, jsonb_build_object('title', NEW.title, 'stream_url', NEW.stream_url, 'provider', NEW.provider));
    END IF;

    UPDATE public.live_streams SET replay_created = true WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_replay_on_end ON public.live_streams;
CREATE TRIGGER trg_create_replay_on_end
AFTER UPDATE ON public.live_streams
FOR EACH ROW
EXECUTE FUNCTION public.create_replay_on_end();

-- 7) Optional: process_replay_queue RPC that can be called by a scheduled function or worker to create video entries
CREATE OR REPLACE FUNCTION public.process_replay_queue(p_limit integer DEFAULT 10)
RETURNS integer AS $$
DECLARE
  r record;
  v_url text;
  inserted_count integer := 0;
BEGIN
  FOR r IN SELECT * FROM public.replay_queue WHERE processed = false ORDER BY created_at LIMIT p_limit LOOP
    -- attempt to build a video url for youtube provider
    IF (r.payload->>'provider') = 'youtube' AND r.payload->>'stream_url' IS NOT NULL THEN
      v_url := 'https://www.youtube.com/watch?v=' || regexp_replace(r.payload->>'stream_url', '^.*(?:v=|v/|embed/|youtu\.be/)([A-Za-z0-9_-]{11}).*$', '\1');
    ELSE
      v_url := r.payload->>'stream_url';
    END IF;

    -- Insert into videos (runs as SECURITY DEFINER to bypass RLS insert restrictions)
    INSERT INTO public.videos (title, description, video_url, is_live, metadata, published_at, created_at)
    VALUES (
      (r.payload->>'title')::text,
      NULL,
      v_url,
      false,
      jsonb_build_object('generated_from_live', r.live_stream_id),
      now(),
      now()
    );

    UPDATE public.replay_queue SET processed = true WHERE id = r.id;
    inserted_count := inserted_count + 1;
  END LOOP;

  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== ROLLBACK =====
-- To rollback: run the following statements in reverse order (careful in production):
-- DROP FUNCTION IF EXISTS public.process_replay_queue(integer);
-- DROP TRIGGER IF EXISTS trg_create_replay_on_end ON public.live_streams;
-- DROP FUNCTION IF EXISTS public.create_replay_on_end();
-- DROP TABLE IF EXISTS public.replay_queue;
-- DROP TRIGGER IF EXISTS trg_live_notify_started ON public.live_streams;
-- DROP FUNCTION IF EXISTS public.notify_live_started();
-- DROP FUNCTION IF EXISTS public.activate_scheduled_live();
-- DROP FUNCTION IF EXISTS public.rpc_increment_viewer(uuid, integer, uuid);
-- DROP TABLE IF EXISTS public.live_stats;
-- ALTER TABLE public.live_streams DROP COLUMN IF EXISTS scheduled_at;
-- ALTER TABLE public.live_streams DROP COLUMN IF EXISTS replay_created;
