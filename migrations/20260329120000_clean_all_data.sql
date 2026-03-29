-- RPC utilisée par le bouton CLEAN du SetupWizard et le nettoyage « SQL » côté admin.
-- Délègue à reset_all_data si elle existe (logique métier centralisée côté base).
-- À appliquer sur Supabase : SQL Editor ou `supabase db push`.

CREATE OR REPLACE FUNCTION public.clean_all_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'reset_all_data'
  ) THEN
    PERFORM public.reset_all_data();
    RETURN;
  END IF;

  RAISE EXCEPTION 'clean_all_data: fonction public.reset_all_data introuvable. Déployez d''abord reset_all_data.';
END;
$$;

COMMENT ON FUNCTION public.clean_all_data() IS
  'Nettoyage complet des données applicatives ; délègue à reset_all_data.';

-- Accès pour les utilisateurs authentifiés (la fonction vérifie en interne les rôles si besoin).
GRANT EXECUTE ON FUNCTION public.clean_all_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clean_all_data() TO service_role;
