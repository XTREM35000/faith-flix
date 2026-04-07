-- Hotfix: remove recursive/conflicting RLS policies on public.parish_members
-- Goal: stop 500/42P17 and keep predictable access rules.

BEGIN;

-- Ensure helper functions exist and are recursion-safe (no self-query on parish_members).
CREATE OR REPLACE FUNCTION public.is_developer(p_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_uid = '11111111-1111-1111-1111-111111111111'::uuid;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_super(p_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_developer(p_uid)
    OR EXISTS (
      SELECT 1
      FROM public.admin_users au
      WHERE au.id = p_uid
    );
$$;

DO $$
DECLARE
  r record;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'parish_members'
  ) THEN
    EXECUTE 'ALTER TABLE public.parish_members ENABLE ROW LEVEL SECURITY';

    -- Drop all existing policies to avoid legacy recursive/conflicting rules.
    FOR r IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'parish_members'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.parish_members', r.policyname);
    END LOOP;

    -- Read own memberships; admins/super/developer read all.
    EXECUTE $sql$
      CREATE POLICY parish_members_select_safe
      ON public.parish_members
      FOR SELECT
      USING (
        user_id = auth.uid()
        OR public.is_admin_or_super()
      )
    $sql$;

    -- Insert own membership (for setup flows) or full insert for admins/super/developer.
    EXECUTE $sql$
      CREATE POLICY parish_members_insert_safe
      ON public.parish_members
      FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        OR public.is_admin_or_super()
      )
    $sql$;

    -- Update own membership row or full update for admins/super/developer.
    EXECUTE $sql$
      CREATE POLICY parish_members_update_safe
      ON public.parish_members
      FOR UPDATE
      USING (
        user_id = auth.uid()
        OR public.is_admin_or_super()
      )
      WITH CHECK (
        user_id = auth.uid()
        OR public.is_admin_or_super()
      )
    $sql$;

    -- Delete membership for admins/super/developer only.
    EXECUTE $sql$
      CREATE POLICY parish_members_delete_safe
      ON public.parish_members
      FOR DELETE
      USING (
        public.is_admin_or_super()
      )
    $sql$;
  ELSE
    RAISE NOTICE 'Table public.parish_members not found, skipping parish_members hotfix.';
  END IF;
END $$;

COMMIT;

