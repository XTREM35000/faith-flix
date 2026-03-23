import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const readSession = () => supabase.auth.getSession();

      let { data, error } = await readSession();

      if (error) {
        console.error('Erreur callback:', error);
        navigate('/?error=callback_failed#auth');
        return;
      }

      if (!data.session) {
        await new Promise((r) => setTimeout(r, 400));
        const second = await readSession();
        data = second.data;
        error = second.error;
      }

      if (error) {
        navigate('/?error=callback_failed#auth');
        return;
      }

      if (data.session) {
        navigate('/?confirmed=true#auth', { replace: true });
        return;
      }

      navigate('/?error=confirmation_pending#auth', { replace: true });
    };

    void handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" aria-hidden />
        <p className="text-muted-foreground">Finalisation de la confirmation…</p>
      </div>
    </div>
  );
};

export default AuthCallback;
