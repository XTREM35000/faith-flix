import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const ChangePasswordForm: React.FC = () => {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePasswords = (): boolean => {
    if (!currentPassword) {
      toast({
        title: '⚠️ Erreur',
        description: 'Veuillez entrer votre mot de passe actuel',
        variant: 'destructive',
      });
      return false;
    }

    if (!newPassword || newPassword.length < 8) {
      toast({
        title: '⚠️ Erreur',
        description: 'Le nouveau mot de passe doit contenir au moins 8 caractères',
        variant: 'destructive',
      });
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: '⚠️ Erreur',
        description: 'Les mots de passe ne correspondent pas',
        variant: 'destructive',
      });
      return false;
    }

    if (currentPassword === newPassword) {
      toast({
        title: '⚠️ Erreur',
        description: 'Le nouveau mot de passe doit être différent de l\'ancien',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }

    setLoading(true);
    try {
      // Mettre à jour le mot de passe directement
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('Erreur changement mot de passe:', updateError);
        toast({
          title: '❌ Erreur',
          description: `Impossible de mettre à jour le mot de passe: ${updateError.message}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: '✅ Succès',
          description: 'Votre mot de passe a été modifié avec succès',
          variant: 'default',
        });

        // Réinitialiser les champs
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Erreur changement mot de passe:', err);
      toast({
        title: '❌ Erreur',
        description: 'Une erreur est survenue lors du changement de mot de passe',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Changer mon mot de passe</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          {/* Mot de passe actuel */}
          <div>
            <label className="text-sm font-medium mb-2 block">Mot de passe actuel</label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Votre mot de passe actuel"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label className="text-sm font-medium mb-2 block">Nouveau mot de passe</label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirmer le mot de passe */}
          <div>
            <label className="text-sm font-medium mb-2 block">Confirmer le mot de passe</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre nouveau mot de passe"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Bouton Soumettre */}
          <div className="flex gap-3">
            <Button 
              type="submit" 
              disabled={loading}
              className="gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </Button>
          </div>

          {/* Info de sécurité */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">🔒 Conseils de sécurité :</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Utilisez un mot de passe unique et difficile à deviner</li>
              <li>Mélangez majuscules, minuscules, chiffres et caractères spéciaux</li>
              <li>Ne partagez jamais votre mot de passe</li>
              <li>Changez votre mot de passe régulièrement</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChangePasswordForm;
