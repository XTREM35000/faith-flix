import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const EmailConfirmedPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Vérification en cours...');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Supabase envoie le token dans le fragment URL (#)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        console.log('🔍 Email Confirmed Page - Vérification du token');
        console.log('📍 Fragment URL:', window.location.hash);
        console.log('🎫 Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'MANQUANT');
        console.log('📝 Type:', type);

        if (!accessToken) {
          console.error('❌ Pas de token trouvé');
          setStatus('error');
          setMessage('Lien invalide ou expiré. Veuillez vérifier votre email à nouveau.');
          return;
        }

        // Créer une session avec le token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: accessToken,
          type: 'email_change',
        });

        if (error) {
          // Essayer avec email
          console.log('🔄 Tentative avec email...');
          
          // En réalité, Supabase devrait automatiquement établir la session
          // Vérifions si l'utilisateur est authentifié
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError || !userData.user) {
            console.error('❌ Erreur authentification:', userError?.message);
            setStatus('error');
            setMessage('Erreur lors de la confirmation. Veuillez vous connecter manuellement.');
            return;
          }

          console.log('✅ Utilisateur authentifié:', userData.user.email);
        } else {
          console.log('✅ Email vérifié avec succès via OTP');
        }

        // L'authentification devrait déjà être établie
        setStatus('success');
        setMessage('Votre email a été confirmé avec succès !');

        // Auto-redirection après 5 secondes
        setTimeout(() => {
          navigate('/#auth');
        }, 5000);
      } catch (err) {
        console.error('❌ Exception:', err);
        setStatus('error');
        setMessage('Une erreur est survenue. Veuillez réessayer.');
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="flex justify-center mb-6"
            >
              <CheckCircle2 className="w-16 h-16 text-blue-500" />
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Vérification en cours...
            </h1>
            <p className="text-muted-foreground">
              Veuillez patienter pendant que nous confirmions votre email.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
              className="flex justify-center mb-6"
            >
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-2xl font-bold text-foreground mb-3"
            >
              Vérification effectuée ✅
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-muted-foreground mb-6"
            >
              {message}
              <br />
              <br />
              Vous pouvez maintenant vous connecter avec vos identifiants.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="space-y-3"
            >
              <Button
                onClick={() => navigate('/#auth')}
                className="w-full h-10"
              >
                Aller à la connexion
              </Button>
              <Button
                variant="outline"
                onClick={() => window.close()}
                className="w-full h-10"
              >
                Fermer cette page
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Redirection automatique dans 5 secondes...
              </p>
            </motion.div>
          </>
        )}

        {status === 'error' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
              className="flex justify-center mb-6"
            >
              <AlertCircle className="w-16 h-16 text-red-500" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-2xl font-bold text-foreground mb-3"
            >
              Erreur de vérification ❌
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-muted-foreground mb-6"
            >
              {message}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="space-y-3"
            >
              <Button
                onClick={() => navigate('/#auth')}
                className="w-full h-10"
              >
                Retour à la connexion
              </Button>
              <Button
                variant="outline"
                onClick={() => window.close()}
                className="w-full h-10"
              >
                Fermer cette page
              </Button>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default EmailConfirmedPage;
