import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAuthCallbackUrl, supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type LocationState = { email?: string } | null;

const EmailConfirmationSent = () => {
  const location = useLocation();
  const { toast } = useToast();
  const state = location.state as LocationState;
  const emailFromState = state?.email?.trim() ?? '';
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!emailFromState) {
      toast({
        title: 'Email inconnu',
        description: 'Revenez à l’inscription et utilisez la même adresse, ou connectez-vous si le compte existe déjà.',
        variant: 'destructive',
      });
      return;
    }
    setResending(true);
    try {
      const redirect = getAuthCallbackUrl() || undefined;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailFromState,
        options: redirect ? { emailRedirectTo: redirect } : undefined,
      });
      if (error) throw error;
      toast({
        title: 'Email renvoyé',
        description: 'Vérifiez votre boîte de réception et les courriers indésirables.',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({
        title: 'Impossible de renvoyer',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md p-8 rounded-xl border border-border bg-card shadow-sm">
        <Mail className="h-16 w-16 text-primary mx-auto mb-4" aria-hidden />
        <h1 className="text-2xl font-bold mb-2 text-foreground">Vérifiez votre email</h1>
        <p className="text-muted-foreground mb-4">
          Un lien de confirmation a été envoyé à votre adresse email. Cliquez sur le lien pour activer votre compte.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Vous n’avez pas reçu d’email ? Vérifiez vos spams ou{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || !emailFromState}
            className="text-primary underline font-medium disabled:opacity-50 disabled:no-underline"
          >
            {resending ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Envoi…
              </span>
            ) : (
              'renvoyer le lien'
            )}
          </button>
        </p>
        {!emailFromState && (
          <p className="text-xs text-muted-foreground mb-4">
            Le renvoi nécessite l’email utilisé à l’inscription : repassez par la page d’accueil → Inscription.
          </p>
        )}
        <Button asChild variant="outline" className="w-full">
          <Link to="/">Retour à l’accueil</Link>
        </Button>
      </div>
    </div>
  );
};

export default EmailConfirmationSent;
