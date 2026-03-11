import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

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
        // Try localStorage cache first
        const cached = localStorage.getItem('ff_profile_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          setProfile(parsed.data);
          setRole(parsed.data.role || null);
          setLoading(false);
        } else {
          // Fetch profile from Supabase
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          setProfile(data);
          setRole(data?.role || null);
          try { localStorage.setItem('ff_profile_cache', JSON.stringify({ data, cachedAt: Date.now() })); } catch {}
          setLoading(false);
        }
      } else {
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    };
    loadSession();
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });
    return () => {
      listener?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, profile, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Déplacé dans useAuthContext.ts pour respecter react-refresh/only-export-components
}
