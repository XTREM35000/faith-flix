import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import PasswordField from '@/components/ui/password-field';
import PhoneInputWithCountry from "@/components/PhoneInputWithCountry";
import { EmailFieldPro } from "@/components/ui/email-field-pro";
import { ensureProfileExists } from "@/utils/ensureProfileExists";
import { isValidEmail } from "@/utils/emailSanitizer";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+225");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const fullPhone = phone ? `${countryCode}${phone}` : "";

  const handleAvatarClick = () => {
    document.getElementById("avatar-upload")?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(String(reader.result));
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(null);
    }
  };

  /** Attendre que l’avatar soit bien écrit dans sessionStorage (évite course au clic rapide). */
  const persistPendingAvatar = (userId: string, file: File) =>
    new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          sessionStorage.setItem(
            'pending_avatar_upload',
            JSON.stringify({
              fileData: reader.result,
              fileName: `${userId}/${Date.now()}_avatar.${file.name.split('.').pop()}`,
              mimeType: file.type,
            }),
          );
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
      reader.readAsDataURL(file);
    });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // EmailFieldPro : valeur complète (local + domaine sélectionné ou « Autre »)
    const emailToSubmit = email.trim();

    if (!emailToSubmit) {
      toast({
        title: '❌ Email requis',
        description: 'Veuillez compléter votre adresse email (identifiant + domaine).',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidEmail(emailToSubmit)) {
      toast({
        title: '❌ Email invalide',
        description: 'Vérifiez l’identifiant et le domaine (ex. prenom.nom@gmail.com).',
        variant: 'destructive',
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: '❌ Mot de passe requis',
        description: 'Veuillez entrer un mot de passe',
        variant: 'destructive',
      });
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: '❌ Champs requis',
        description: 'Veuillez entrer votre prénom et votre nom',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Rôle : laissé au trigger SQL (handle_auth_user_created) — évite un SELECT profiles avant signup
      // (anon / RLS) et aligne le flux sur un signUp minimal type curl.
      type AuthSignUpRes = {
        data?: { user?: { id?: string } | null; session?: unknown } | null;
      };
      const registerRes = (await signUpWithEmail(emailToSubmit, password, {
        full_name: fullName,
        phone: fullPhone || undefined,
      })) as unknown as AuthSignUpRes;

      const createdUser = registerRes?.data?.user ?? null;
      const hasSession = !!registerRes?.data?.session;

      // Session active = confirmation email désactivée côté projet : compléter profil / avatar tout de suite
      if (hasSession && createdUser?.id) {
        try {
          await ensureProfileExists(createdUser.id);
        } catch (profileErr) {
          console.error('ensureProfileExists après inscription:', profileErr);
        }
        if (avatarFile) {
          try {
            await persistPendingAvatar(createdUser.id, avatarFile);
            console.log('✅ Avatar stocké en sessionStorage (pending)');
          } catch (err) {
            console.error('Erreur stockage avatar en sessionStorage:', err);
          }
        }
        toast({
          title: '✅ Inscription réussie',
          description: 'Votre compte est prêt.',
        });
        if (onSuccess) {
          setTimeout(() => onSuccess(), 300);
        } else {
          setTimeout(() => navigate('/'), 300);
        }
        return;
      }

      // Pas de session : confirmation par email (comportement attendu si « Confirm email » est activé)
      if (createdUser?.id && avatarFile) {
        try {
          await persistPendingAvatar(createdUser.id, avatarFile);
        } catch (err) {
          console.error('Erreur stockage avatar en sessionStorage:', err);
        }
      }

      toast({
        title: '✅ Presque terminé',
        description: 'Un email de confirmation vous a été envoyé.',
      });
      navigate('/email-confirmation-sent', { state: { email: emailToSubmit }, replace: true });
    } catch (err: unknown) {
      console.error('❌ Erreur lors de l\'enregistrement:', err);
      const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
      const already =
        msg.includes('already registered') ||
        msg.includes('already been registered') ||
        msg.includes('user already exists');
      if (already) {
        toast({
          title: 'Compte déjà existant',
          description: 'Cette adresse est déjà utilisée. Connectez-vous ou réinitialisez votre mot de passe.',
          variant: 'destructive',
        });
        onSwitchToLogin?.();
        return;
      }
      toast({
        title: '⚠️ Erreur lors de l\'inscription',
        description: err instanceof Error ? err.message : 'Veuillez réessayer ou vérifier votre email.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2 w-full text-sm">
      {/* Section Avatar compacte en haut */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center space-y-1 flex-shrink-0">
          <div
            onClick={handleAvatarClick}
            className="relative w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer bg-muted/30 overflow-hidden group"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Aperçu avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground text-center">Avatar</p>
        </div>

        {/* Champs principaux */}
        <div className="flex-1 space-y-2">
          {/* Prénom + Nom sur une ligne */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-0.5">Prénom *</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                type="text"
                placeholder="Jean"
                required
                className="h-8 text-xs"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-0.5">Nom *</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                type="text"
                placeholder="Dupont"
                required
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Email avec sélecteur de domaine (composant réutilisable) */}
          <EmailFieldPro
            value={email}
            onChange={setEmail}
            label="Email"
            required
            onValidationChange={() => {}}
            className="h-8 text-xs"
          />

          {/* Mot de passe avec indicateur */}
          <div>
            <label className="block text-xs font-medium mb-0.5">Mot de passe *</label>
            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Au moins 8 caractères"
              required
              className="h-9"
            />
            <PasswordStrengthMeter password={password} />
          </div>

          {/* Téléphone avec indicatif */}
          <div>
            <label className="block text-xs font-medium mb-0.5">Téléphone</label>
            <PhoneInputWithCountry
              phone={phone}
              onPhoneChange={setPhone}
              countryCode={countryCode}
              onCountryChange={setCountryCode}
            />
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={loading} className="flex-1 h-8 text-xs">
          {loading ? "Création..." : "Créer mon compte"}
        </Button>
      </div>

      {/* Providers removed for registration to simplify signup flow. */}

      <p className="text-xs text-muted-foreground text-center py-1">
        * Champs obligatoires
      </p>
    </form>
  );
};

export default RegisterForm;