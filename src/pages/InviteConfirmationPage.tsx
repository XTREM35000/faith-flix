import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import PasswordField from '@/components/ui/password-field';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const InviteConfirmationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const email = searchParams.get('email') ?? '';

  useEffect(() => {
    const checkInviteSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError('Session invalide. Ouvrez a nouveau le lien depuis votre email.');
        return;
      }

      if (data.session) {
        setReady(true);
        return;
      }

      // detectSessionInUrl may require one extra tick
      await new Promise((r) => setTimeout(r, 350));
      const secondRead = await supabase.auth.getSession();
      if (secondRead.data.session) {
        setReady(true);
        return;
      }

      setError("Le lien d'invitation est invalide ou expire.");
    };

    void checkInviteSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { invitation_completed_at: new Date().toISOString() },
      });
      if (updateError) throw updateError;

      toast({
        title: 'Compte active',
        description: 'Votre mot de passe est defini. Redirection vers le dashboard...',
      });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Impossible de finaliser votre inscription.';
      setError(message);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border rounded-lg p-6 space-y-4">
        <h1 className="text-xl font-semibold">Activation de votre compte</h1>
        <p className="text-sm text-muted-foreground">
          {email ? `Invitation pour ${email}` : 'Definissez votre mot de passe pour activer votre compte.'}
        </p>

        {!ready && !error && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validation du lien en cours...
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {ready && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm block mb-1">Mot de passe</label>
              <PasswordField
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Au moins 8 caracteres"
                disabled={loading}
                required
              />
              <PasswordStrengthMeter password={password} />
            </div>
            <div>
              <label className="text-sm block mb-1">Confirmer le mot de passe</label>
              <PasswordField
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le mot de passe"
                disabled={loading}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Activation...' : 'Activer mon compte'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default InviteConfirmationPage;

