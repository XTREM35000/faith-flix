-- Signup 500 "Database error saving new user"
-- Causes fréquentes :
-- 1) RLS sur public.profiles : INSERT refusé (auth.uid() NULL pendant le trigger).
-- 2) SET LOCAL row_security = off ignoré ou insuffisant selon le rôle réel d’exécution.
--
-- Correctif : politique INSERT permissive UNIQUEMENT si l’id existe déjà dans auth.users
-- (ligne tout juste créée avant le trigger AFTER INSERT). Aucun accès client arbitraire.
--
-- NB : sur auth.users, utiliser uniquement raw_user_meta_data (pas user_metadata : colonne inexistante).

-- ---------------------------------------------------------------------------
-- Politique RLS : profil insérable si l’utilisateur auth correspondant existe
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_insert_if_matching_auth_user" ON public.profiles;
CREATE POLICY "profiles_insert_if_matching_auth_user"
ON public.profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM auth.users au
    WHERE au.id = id
      AND au.created_at >= (now() - interval '2 minutes')
  )
);

COMMENT ON POLICY "profiles_insert_if_matching_auth_user" ON public.profiles IS
  'INSERT profil seulement si auth.users.id correspond et compte créé il y a < 2 min (signup / trigger).';

-- ---------------------------------------------------------------------------
-- Fonction trigger (SECURITY DEFINER + search_path fixe)
-- ---------------------------------------------------------------------------
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
  v_full_name TEXT;
  v_avatar TEXT;
  v_meta JSONB;
BEGIN
  v_meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);

  v_paroisse_id := NULL;
  IF (v_meta->>'paroisse_id') IS NOT NULL AND (v_meta->>'paroisse_id') != '' THEN
    BEGIN
      v_paroisse_id := (v_meta->>'paroisse_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_paroisse_id := NULL;
    END;
  END IF;

  IF v_paroisse_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM public.profiles
    WHERE paroisse_id = v_paroisse_id;
    IF v_count = 0 THEN
      v_role := 'super_admin';
    END IF;
  ELSE
    SELECT COUNT(*) INTO v_count FROM public.profiles;
    IF v_count = 0 THEN
      v_role := 'super_admin';
    END IF;
  END IF;

  v_full_name := COALESCE(
    NULLIF(TRIM(COALESCE(v_meta->>'full_name', '')), ''),
    NULLIF(TRIM(COALESCE(NEW.email, '')), ''),
    'Utilisateur'
  );

  v_avatar := NULLIF(
    TRIM(COALESCE(v_meta->>'avatar_url', v_meta->>'picture', '')),
    ''
  );

  BEGIN
    SET LOCAL row_security = off;

    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      avatar_url,
      role,
      paroisse_id,
      is_active,
      notification_preferences,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NULLIF(TRIM(COALESCE(NEW.email, '')), ''), v_full_name),
      v_full_name,
      v_avatar,
      v_role,
      v_paroisse_id,
      TRUE,
      '{"email": true, "push": false, "sms": false}'::jsonb,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      updated_at = NOW(),
      email = COALESCE(NULLIF(EXCLUDED.email, ''), public.profiles.email),
      full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_auth_user_created: failed for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_auth_user_created() OWNER TO postgres;

DROP TRIGGER IF EXISTS trigger_auth_user_created ON auth.users;
CREATE TRIGGER trigger_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

COMMENT ON FUNCTION public.handle_auth_user_created() IS
  'Crée public.profiles à l’inscription. Politique RLS profiles_insert_if_matching_auth_user + row_security off.';
