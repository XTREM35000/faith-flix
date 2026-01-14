import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';
import { AlertCircle, CheckCircle, Lock } from 'lucide-react';
import PasswordField from '@/components/ui/password-field';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(true);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    // Supabase envoie le token dans le fragment URL (#), pas en query params
    // URL: /reset-password#access_token=xxxxx&type=recovery&expires_in=3600
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    console.log('🔍 DEBUG Reset Password Page');
    console.log('📍 URL complète:', window.location.href);
    console.log('🔗 Fragment (hash):', window.location.hash);
    console.log('🎫 Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'MANQUANT');
    console.log('📝 Type:', type);

    // Vérifier le token
    if (!accessToken || type !== 'recovery') {
      console.error('❌ Token invalide ou type incorrect');
      setTokenValid(false);
      setError('Lien invalide ou expiré. Veuillez faire une nouvelle demande.');
      return;
    }

    console.log('✅ Token valide trouvé !');
    setTokenValid(true);
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !passwordConfirm) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Tentative de réinitialisation du mot de passe...');
      
      const { error: resetError } = await supabase.auth.updateUser({
        password: password,
      });

      if (resetError) {
        console.error('❌ Erreur Supabase:', resetError);
        throw resetError;
      }

      console.log('✅ Mot de passe réinitialisé avec succès !');
      setResetSuccess(true);
      toast({
        title: '✅ Succès',
        description: 'Votre mot de passe a été réinitialisé avec succès.',
      });

      // Rediriger vers la connexion après 3 secondes
      setTimeout(() => {
        navigate('/?mode=login#auth');
      }, 3000);
    } catch (err) {
      const msg = (err as Error)?.message || 'Erreur lors de la réinitialisation';
      setError(msg);
      toast({
        title: '❌ Erreur',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
            <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Réinitialiser mot de passe</h1>
            <p className="text-sm text-muted-foreground">
              Sécurisez votre compte avec un nouveau mot de passe
            </p>
          </div>
        </div>

        {/* Token Invalid */}
        {!tokenValid && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg mb-4 flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Lien expiré ou invalide</p>
              <p className="text-sm mt-1">
                Veuillez faire une nouvelle demande de réinitialisation de mot de passe.
              </p>
              <Button
                onClick={() => navigate('/?mode=login#auth')}
                className="mt-3 text-sm h-8"
                variant="outline"
              >
                Retour à la connexion
              </Button>
            </div>
          </div>
        )}

        {/* Reset Success */}
        {resetSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 p-4 rounded-lg mb-4 flex gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">✓ Mot de passe réinitialisé</p>
              <p className="text-sm mt-1">
                Votre mot de passe a été modifié avec succès. Redirection vers la connexion...
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        {tokenValid && !resetSuccess && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm flex gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Nouveau mot de passe *</label>
              <PasswordField
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                className="h-9 text-sm"
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Password Strength */}
            {password && <PasswordStrengthMeter password={password} />}

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Confirmer le mot de passe *</label>
              <PasswordField
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                className="h-9 text-sm"
                disabled={loading}
              />
              {password && passwordConfirm && password === passwordConfirm && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Les mots de passe correspondent
                </p>
              )}
              {password && passwordConfirm && password !== passwordConfirm && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Les mots de passe ne correspondent pas
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">💡 Conseils de sécurité</p>
              <ul className="text-xs space-y-0.5 list-disc list-inside">
                <li>Au moins 8 caractères</li>
                <li>Mélangez majuscules, minuscules et chiffres</li>
                <li>Évitez d'utiliser des informations personnelles</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={loading || !password || !passwordConfirm || password.length < 8}
                className="flex-1 h-9 text-sm bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/?mode=login#auth')}
                disabled={loading}
                className="h-9 text-sm"
              >
                Annuler
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
