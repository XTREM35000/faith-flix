import { supabase } from '@/integrations/supabase/client';

// Guard module-level pour éviter l’exécution multiple (React StrictMode en dev).
const developerInitRef = { current: false };

export const ensureDeveloperAccount = async () => {
  // Ne pas appeler si déjà en cours (ou déjà tenté).
  if (developerInitRef.current) return;
  developerInitRef.current = true;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Si l’utilisateur est déjà connecté, ne rien faire.
    if (session) return;

    // Créer/réparer le compte developer via RPC (idempotent) au lieu d’une Edge Function.
    const { error } = await supabase.rpc('ensure_developer_account');
    if (error) throw error;
  } catch (error) {
    console.error('[Init] Developer account error:', error);
  }
};
