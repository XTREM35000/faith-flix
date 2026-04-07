-- Migration: Fix user management for multi-parish system
-- 1. handle_new_user: first user of parish = super_admin
-- 2. delete_user RPC (calls Edge Function; this migration sets up RLS)
-- 3. RLS policies for super_admin delete

-- ============================================================
-- 1. Add paroisse_id to profiles if not exists
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'paroisse_id'
  ) THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'paroisses') THEN
      ALTER TABLE public.profiles ADD COLUMN paroisse_id UUID REFERENCES public.paroisses(id) ON DELETE SET NULL;
    ELSE
      ALTER TABLE public.profiles ADD COLUMN paroisse_id UUID;
    END IF;
  END IF;
END $$;

-- ============================================================
-- 2. Replace handle_auth_user_created with first-user logic
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paroisse_id UUID;
  v_role TEXT := 'membre';
  v_count BIGINT;
BEGIN
  v_paroisse_id := NULL;
  IF (COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)->>'paroisse_id') IS NOT NULL AND
     (COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)->>'paroisse_id') != '' THEN
    BEGIN
      v_paroisse_id := (COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)->>'paroisse_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_paroisse_id := NULL;
    END;
  END IF;

  IF v_paroisse_id IS NOT NULL THEN
    -- Multi-parish: first user of this parish = super_admin
    SELECT COUNT(*) INTO v_count
    FROM public.profiles
    WHERE paroisse_id = v_paroisse_id;
    IF v_count = 0 THEN
      v_role := 'super_admin';
    END IF;
  ELSE
    -- No parish: first user overall = super_admin
    SELECT COUNT(*) INTO v_count FROM public.profiles;
    IF v_count = 0 THEN
      v_role := 'super_admin';
    END IF;
  END IF;

  BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, paroisse_id, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      COALESCE(
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.user_metadata->>'full_name'),
        NEW.email,
        'Utilisateur'
      ),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.user_metadata->>'avatar_url'),
      v_role,
      v_paroisse_id,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'handle_auth_user_created: failed for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_auth_user_created ON auth.users;
CREATE TRIGGER trigger_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- ============================================================
-- 3. RPC delete_user - only deletes from profiles
--    (auth.users deletion is done by Edge Function delete-user)
--    This RPC is kept for compatibility; frontend should call Edge Function.
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_user(target_id UUID)
RETURNS VOID AS $$
DECLARE
  caller_role TEXT;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid() LIMIT 1;

  IF caller_role != 'super_admin' THEN
    RAISE EXCEPTION 'Permission denied: only super_admin can delete users';
  END IF;

  DELETE FROM public.profiles WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO service_role;

-- ============================================================
-- 4. RLS: super_admin can delete profiles
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_delete_admin_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

CREATE POLICY "profiles_delete_super_admin"
ON public.profiles
FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'super_admin'
  )
);
