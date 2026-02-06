import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ensureProfileExists } from '@/utils/ensureProfileExists';
import { useToast } from '@/hooks/use-toast';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔍 AuthCallback: Vérification de la session OAuth...');
        
        // Récupérer l'utilisateur actuellement connecté
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('❌ AuthCallback: Erreur lors de la récupération de l\'utilisateur:', userError);
          toast({
            title: '❌ Erreur d\'authentification',
            description: userError.message,
            variant: 'destructive',
          });
          window.location.href = '/login?error=oauth';
          return;
        }

        if (!user) {
          console.warn('⚠️ AuthCallback: Aucun utilisateur trouvé');
          window.location.href = '/login?error=no_user';
          return;
        }

        console.log('✅ AuthCallback: Utilisateur authentifié:', user.id);

        // Assurer que le profil existe
        try {
          await ensureProfileExists(user.id);
          console.log('✅ AuthCallback: Profil assuré');
        } catch (profileError) {
          console.error('⚠️ AuthCallback: Erreur lors de l\'assurance du profil:', profileError);
          // Continuer malgré tout car l'utilisateur s'est authentifié
        }

        // Rediriger vers le dashboard (AuthProvider gèrera le rôle et la redirection finale)
        console.log('🔄 AuthCallback: Redirection vers /');
        window.location.href = '/';
      } catch (error) {
        console.error('❌ AuthCallback: Erreur inattendue:', error);
        toast({
          title: '❌ Erreur lors du callback OAuth',
          description: String((error as any)?.message || error),
          variant: 'destructive',
        });
        window.location.href = '/login?error=callback';
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Authentification en cours...</h2>
        <p className="text-muted-foreground">Veuillez patienter pendant que nous complètes votre connexion.</p>
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
