

import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const signInWithFacebook = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          scopes: 'email,public_profile'
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Retourner les autres fonctions du contexte si nécessaire
  // Pour l'instant, juste signInWithFacebook
  return { signInWithFacebook };
};


