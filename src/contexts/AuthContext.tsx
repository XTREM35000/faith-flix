import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

import type { Profile } from '@/types/database';

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) {
        // Toujours récupérer le profil le plus à jour depuis Supabase
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('AuthContext: error fetching profile', error);
        }

        const mergedProfile = data ? {
          ...data,
          display_name: (data as any).display_name ?? (data as any).full_name ?? '',
          location: (data as any).location ?? '',
          date_of_birth: (data as any).date_of_birth ?? '',
          is_active: typeof (data as any).is_active === 'boolean' ? (data as any).is_active : true,
          notification_preferences: (data as any).notification_preferences ?? { email: true, push: false, sms: false },
        } : null;

        setProfile(mergedProfile);
        setRole((data as any)?.role || session.user.user_metadata?.role || null);

        try {
          localStorage.setItem('ff_profile_cache', JSON.stringify({ data, cachedAt: Date.now() }));
        } catch {
          // ignore cache errors
        }
        setLoading(false);
      } else {
        setProfile(null);
        setRole(null);
        try { localStorage.removeItem('ff_profile_cache'); } catch { /* ignore */ }
        setLoading(false);
      }
    };
    loadSession();
    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });
    return () => {
      data?.subscription?.unsubscribe();
    };
  }, []);

  // Fonction signOut à exposer dans le contexte
  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      setRole(null);
      try { localStorage.removeItem('ff_profile_cache'); } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  };

  // Fonction login à exposer dans le contexte
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) throw res.error;
      setSession(res.data.session ?? null);
      setUser(res.data.user ?? null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, role, loading, signOut, login }}>
      {children}
    </AuthContext.Provider>
  );
};

// Déplacé dans useAuthContext.ts pour respecter react-refresh/only-export-components
