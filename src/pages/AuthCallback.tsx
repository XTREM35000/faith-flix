import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ensureProfileExists } from '@/utils/ensureProfileExists';
import { useToast } from '@/hooks/use-toast';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      try {
        console.log('🔍 AuthCallback: Vérification de la session OAuth...', {
          href: window.location.href,
          hash: window.location.hash,
          search: window.location.search,
        });
        
        // Récupérer l'utilisateur actuellement connecté
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('❌ AuthCallback: Erreur lors de la récupération de l\'utilisateur:', userError);
          if (!isMounted) return;
          toast({
            title: '❌ Erreur d\'authentification',
            description: userError.message,
            variant: 'destructive',
          });
          // Rediriger après 2 secondes pour laisser le toast 
          setTimeout(() => {
            if (isMounted) window.location.replace('/login?error=oauth');
          }, 2000);
          return;
        }

        if (!user) {
          console.warn('⚠️ AuthCallback: Aucun utilisateur trouvé');
          if (!isMounted) return;
          setTimeout(() => {
            if (isMounted) window.location.replace('/login?error=no_user');
          }, 2000);
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

        // Rediriger vers la page d'accueil (AuthProvider gèrera le rôle et la redirection finale)
        if (!isMounted) return;
        console.log('🔄 AuthCallback: Redirection vers / après 1s...');
        
        // Utiliser un délai pour laisser le temps aux listeners auth de se mettre à jour
        setTimeout(() => {
          if (isMounted) {
            console.log('🔄 AuthCallback: Exécution de la redirection');
            window.location.replace('/');
          }
        }, 1000);
      } catch (error) {
        if (!isMounted) return;
        console.error('❌ AuthCallback: Erreur inattendue:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
          title: '❌ Erreur lors du callback OAuth',
          description: errorMessage,
          variant: 'destructive',
        });
        setTimeout(() => {
          if (isMounted) window.location.replace('/login?error=callback');
        }, 2000);
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Authentification en cours...</h2>
        <p className="text-muted-foreground">Veuillez patienter pendant que nous complétions votre connexion.</p>
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
