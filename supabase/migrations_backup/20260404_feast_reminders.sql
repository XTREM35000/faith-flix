-- Feast reminders (J-7, J-3, J-1): log + RPC for Edge/cron
-- Preference: profiles.notification_preferences->>'feast_reminders' (default true if absent)

CREATE TABLE IF NOT EXISTS public.feast_reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feast_id UUID NOT NULL REFERENCES public.religious_feasts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  offset_days INTEGER NOT NULL CHECK (offset_days IN (7, 3, 1)),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (feast_id, user_id, offset_days)
);

CREATE INDEX IF NOT EXISTS idx_feast_reminder_log_user ON public.feast_reminder_log(user_id);
CREATE INDEX IF NOT EXISTS idx_feast_reminder_log_feast ON public.feast_reminder_log(feast_id);

ALTER TABLE public.feast_reminder_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feast_reminder_log_no_direct_access" ON public.feast_reminder_log;
CREATE POLICY "feast_reminder_log_no_direct_access"
  ON public.feast_reminder_log
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.feast_reminder_log IS 'Tracks sent feast reminders per user/feast/offset; maintained by process_feast_reminders() only.';

-- Ensure notifications columns used by inserts exist across schema variants
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'system';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;

COMMENT ON COLUMN public.profiles.notification_preferences IS
  'JSONB: email, push, sms, feast_reminders (boolean, default true for feast reminders)';

CREATE OR REPLACE FUNCTION public.process_feast_reminders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date;
  v_pairs int := 0;
  v_inserted int := 0;
BEGIN
  v_today := (now() AT TIME ZONE 'Europe/Paris')::date;

  CREATE TEMP TABLE IF NOT EXISTS _feast_reminder_work (
    feast_id uuid NOT NULL,
    user_id uuid NOT NULL,
    days_before int NOT NULL,
    name text NOT NULL,
    description text
  ) ON COMMIT DROP;

  TRUNCATE _feast_reminder_work;

  INSERT INTO _feast_reminder_work (feast_id, user_id, days_before, name, description)
  WITH offsets AS (
    SELECT unnest(ARRAY[7, 3, 1]) AS days_before
  ),
  due AS (
    SELECT
      f.id AS feast_id,
      f.name,
      f.description,
      o.days_before
    FROM public.religious_feasts f
    INNER JOIN offsets o ON (f.date::date - v_today) = o.days_before
    WHERE f.is_active = true
  ),
  targets AS (
    SELECT p.id AS user_id
    FROM public.profiles p
    WHERE COALESCE(p.is_active, true) = true
      AND COALESCE((p.notification_preferences->>'feast_reminders')::boolean, true) = true
  )
  SELECT d.feast_id, t.user_id, d.days_before, d.name, d.description
  FROM due d
  CROSS JOIN targets t
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.feast_reminder_log l
    WHERE l.feast_id = d.feast_id
      AND l.user_id = t.user_id
      AND l.offset_days = d.days_before
  );

  GET DIAGNOSTICS v_pairs = ROW_COUNT;

  INSERT INTO public.notifications (
    user_id,
    title,
    body,
    type,
    link,
    metadata,
    created_at
  )
  SELECT
    w.user_id,
    format('📆 %s dans %s jour(s)', w.name, w.days_before),
    format(
      'Prépare ton cœur avec cette méditation… %s',
      COALESCE(NULLIF(trim(w.description), ''), 'Ouvre le calendrier des fêtes religieuses.')
    ),
    'religious_feast',
    '/spiritual/feasts/' || w.feast_id::text,
    jsonb_build_object(
      'kind', 'religious_feast_reminder',
      'feast_id', w.feast_id,
      'offset_days', w.days_before
    ),
    now()
  FROM _feast_reminder_work w;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  INSERT INTO public.feast_reminder_log (feast_id, user_id, offset_days)
  SELECT feast_id, user_id, days_before FROM _feast_reminder_work;

  RETURN jsonb_build_object(
    'paris_date', v_today,
    'pairs_eligible', v_pairs,
    'notifications_inserted', v_inserted
  );
END;
$$;

COMMENT ON FUNCTION public.process_feast_reminders() IS 'Creates notifications for J-7, J-3, J-1 before each active religious feast; idempotent via feast_reminder_log.';

GRANT EXECUTE ON FUNCTION public.process_feast_reminders() TO service_role;
