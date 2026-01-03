import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, signInWithProvider } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res: any = await login(email, password);
      const loggedUser = res?.data?.user;
      // Fermer le modal si callback existe
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          // Rediriger selon le rôle (admin/user) après avoir vérifié le profil
          setTimeout(async () => {
            try {
              const uid = loggedUser?.id || (await supabase.auth.getUser()).data?.user?.id;
              let role: string | null = null;
              if (uid) {
                const { data: profileData } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle();
                role = (profileData as any)?.role ?? null;
              }
              const metaRole = (loggedUser?.user_metadata?.role || '') as string;
              const adminFlag = (role || metaRole || '').toLowerCase().includes('admin');
              if (adminFlag) navigate('/admin');
              else navigate('/');
            } catch (err) {
              navigate('/');
            }
          }, 300);
        }, 500);
      } else {
        navigate("/");
      }
    } catch (err: any) {
      console.error('Login error', err);
      // afficher une erreur simple
      try {
        alert(err.message || 'Erreur lors de la connexion');
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <label className="block text-sm">Email</label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
      </div>
      <div>
        <label className="block text-sm">Mot de passe</label>
        <div className="relative">
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? 'text' : 'password'}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? 'Cacher mot de passe' : 'Afficher mot de passe'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? "Connexion..." : "Se connecter"}</Button>
        <Button variant="outline" type="button" onClick={() => signInWithProvider("google")}>Google</Button>
      </div>
    </form>
  );
};

export default LoginForm;
