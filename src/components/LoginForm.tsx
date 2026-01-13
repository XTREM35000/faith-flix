import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff } from 'lucide-react';
import { EmailFieldPro } from "@/components/ui/email-field-pro";
import { ensureProfileExists } from "@/utils/ensureProfileExists";

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onForgotPassword }) => {
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
      const res: unknown = await login(email, password);
      const loggedUser = (res as Record<string, unknown>)?.data?.user as Record<string, unknown> | undefined;
      
      // Créer le profil s'il n'existe pas
      if (loggedUser?.id) {
        console.log('🔍 Vérification/création du profil pour:', loggedUser.id);
        await ensureProfileExists(loggedUser.id as string);
      }
      
      // Fermer le modal si callback existe
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          // Rediriger selon le rôle (admin/user) après avoir vérifié le profil
          setTimeout(async () => {
            try {
              const uid = loggedUser?.id as string | undefined || (await supabase.auth.getUser()).data?.user?.id;
              let role: string | null = null;
              if (uid) {
                const { data: profileData } = await supabase.from('profiles').select('role').eq('id', uid).maybeSingle();
                role = (profileData as Record<string, unknown>)?.role as string | null ?? null;
              }
              const metaRole = (loggedUser?.user_metadata as Record<string, unknown>)?.role as string || '';
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
    } catch (err: unknown) {
      console.error('Login error', err);
      // afficher une erreur simple
      try {
        const errorMsg = (err as Record<string, unknown>).message || 'Erreur lors de la connexion';
        alert(errorMsg);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2 w-full max-w-md text-sm">
      <EmailFieldPro
        value={email}
        onChange={setEmail}
        label="Email"
        required
        onValidationChange={() => {}}
      />
      <div>
        <label className="block text-xs font-medium mb-0.5">Mot de passe</label>
        <div className="relative">
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? 'text' : 'password'}
            required
            className="pr-8 h-8 text-xs"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? 'Cacher mot de passe' : 'Afficher mot de passe'}
          >
            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            onForgotPassword?.();
          }}
          className="text-xs text-blue-600 hover:text-blue-700 mt-1"
        >
          Mot de passe oublié ?
        </button>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={loading} className="flex-1 h-8 text-xs">{loading ? "Connexion..." : "Se connecter"}</Button>
        <Button variant="outline" type="button" onClick={() => signInWithProvider("google")} className="h-8 text-xs">Google</Button>
      </div>
    </form>
  );
};

export default LoginForm;
