import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  created_at?: string | null;
}

// Fonction utilitaire pour invalider le cache du profil
export function invalidateProfileCache() {
  try {
    localStorage.removeItem('ff_profile_cache');
  } catch (e) {
    console.error('Failed to invalidate profile cache:', e);
  }
}

export function useUser() {
  const { user } = useAuth();
  // Try to initialize from localStorage to avoid refetch/flash on remount
  const getCachedProfile = (): UserProfile | null => {
    try {
      const raw = localStorage.getItem('ff_profile_cache');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { data: UserProfile; cachedAt: number };
      // TTL: 10 minutes
      if (Date.now() - (parsed.cachedAt || 0) > 10 * 60 * 1000) {
        localStorage.removeItem('ff_profile_cache');
        return null;
      }
      return parsed.data || null;
    } catch (e) {
      return null;
    }
  };

  const [profile, setProfile] = useState<UserProfile | null>(getCachedProfile());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    // Utiliser une variable pour tracker le montage et éviter les mises à jour après unmount
    let isMounted = true;

    const hasCache = !!profile;

    const fetchProfile = async () => {
      if (!hasCache) setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!isMounted) return; // Vérifier si le composant est toujours monté

        if (error) {
          console.error('Erreur lors de la récupération du profil:', error);
          const fallback = {
            id: user.id,
            email: user.email || '',
          };
          setProfile(fallback);
          try { localStorage.setItem('ff_profile_cache', JSON.stringify({ data: fallback, cachedAt: Date.now() })); } catch (e) {}
        } else {
          const real = (data as UserProfile) || {
            id: user.id,
            email: user.email || '',
          };
          setProfile(real);
          try { localStorage.setItem('ff_profile_cache', JSON.stringify({ data: real, cachedAt: Date.now() })); } catch (e) {}
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du profil:', err);
        if (isMounted) {
          setProfile({
            id: user.id,
            email: user.email || '',
          });
          try { localStorage.setItem('ff_profile_cache', JSON.stringify({ data: { id: user.id, email: user.email || '' }, cachedAt: Date.now() })); } catch (e) {}
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Vérifier l'email_confirmed pour forcer un revalidation après confirmation email
    const isEmailConfirmed = (user?.user_metadata?.email_confirmed as boolean | undefined) ?? (user?.email_confirmed ?? false);
    
    // Forcer une revalidation du profil si l'email vient d'être confirmé (pas de cache)
    if (!hasCache || isEmailConfirmed) {
      fetchProfile();
    }

    return () => {
      isMounted = false;
    };
  }, [user]); // Dépendre de user pour que l'effet se déclenche quand l'objet user change

  const isAdmin = !!(profile && typeof profile.role === 'string' && ['admin', 'administrateur', 'superadmin'].includes(profile.role.toLowerCase()));

  return { profile, isLoading, isAdmin };
}
