// src\components\SetupWizardModal.tsx
// 
import React, { useMemo, useState, useRef, useEffect } from 'react';
import DraggableModal from './DraggableModal';
import { initFirstParoisseAndUser, uploadImageToStorage } from '@/lib/setupWizard';
import { useSetup } from '@/contexts/SetupContext';
import type { HomepageSectionRow } from '@/lib/setupWizard';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Loader2, Camera, UserCircle2 } from 'lucide-react';
import PasswordField from '@/components/ui/password-field';
import { Checkbox } from '@/components/ui/checkbox';
import { isValidEmail } from '@/utils/emailSanitizer';
import { RestoreFromFileModal } from '@/components/admin-master/RestoreFromFileModal';
import { Button } from '@/components/ui/button';

type FormState = {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonLink: string;
  heroImageUrl?: string;

  featuresTitle: string;
  featuresContent: string;

  testimonialsTitle: string;
  testimonialsContent: string;

  aboutContent: string;

  brandingName: string;
  brandingLogo?: string;
  brandingEmail: string;
  brandingPhone?: string;
  brandingAddress?: string;
  brandingFooterText?: string;

  // Header fields
  headerLogo?: string;
  headerMainTitle: string;
  headerSubtitle: string;
};

type ImageField = 'heroImageUrl' | 'brandingLogo' | 'headerLogo';

const WIZARD_STEPS = 4;

export default function SetupWizardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { markCompleted } = useSetup();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [useGravatar, setUseGravatar] = useState(false);
  const [adminAvatarFile, setAdminAvatarFile] = useState<File | null>(null);
  const [adminAvatarPreview, setAdminAvatarPreview] = useState<string | null>(null);
  const adminAvatarInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    heroTitle: 'Bienvenue sur notre paroisse',
    heroSubtitle: 'Une communauté de foi et de service',
    heroButtonText: 'Découvrir',
    heroButtonLink: '/homepage',
    heroImageUrl: undefined,
    featuresTitle: 'Nos activités',
    featuresContent: JSON.stringify([{ title: 'Messes', description: 'Messes dominicales et festivités' }], null, 2),
    testimonialsTitle: 'Témoignages',
    testimonialsContent: JSON.stringify([{ name: 'Jean', text: 'Une belle communauté de foi.' }], null, 2),
    aboutContent: JSON.stringify({ history: '', mission: '', values: '', team: [] }, null, 2),
    brandingName: user?.email?.split('@')[0] ?? 'Ma Paroisse',
    brandingLogo: undefined,
    brandingEmail: user?.email ?? 'contact@paroisse.local',
    brandingPhone: '',
    brandingAddress: '',
    brandingFooterText: '© Ma Paroisse 2026',
    headerLogo: undefined,
    headerMainTitle: user?.email?.split('@')[0] ?? 'Ma Paroisse',
    headerSubtitle: 'Une communauté de foi et de service',
  });

  const progress = useMemo(() => Math.round(((step + 1) / WIZARD_STEPS) * 100), [step]);

  useEffect(() => {
    if (step !== 3) return;
    setAdminEmail(prev => (prev.trim() ? prev : form.brandingEmail));
  }, [step, form.brandingEmail]);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
  };

  const triggerImageUpload = (field: ImageField) => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
      (fileInputRef.current as any).dataset.field = field;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: ImageField) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(field);
    setError(null);
    try {
      const folder = field === 'heroImageUrl' ? 'hero' : field === 'brandingLogo' ? 'branding' : 'header';
      const url = await uploadImageToStorage(file, folder);
      if (!url) throw new Error('Échec du téléchargement');
      setField(field, url);
    } catch (err: any) {
      setError(`Erreur upload ${field}: ${err.message}`);
    } finally {
      setUploading(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const validateStep = () => {
    if (step === 0) {
      return !!form.heroTitle && !!form.featuresTitle;
    }
    if (step === 1) {
      return !!form.aboutContent;
    }
    if (step === 2) {
      return !!form.brandingName && !!form.brandingEmail;
    }
    if (step === 3) {
      return (
        adminFullName.trim().length >= 2 &&
        isValidEmail(adminEmail.trim()) &&
        adminPassword.length >= 6
      );
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return setError('Veuillez remplir les champs requis (*)');
    setError(null);
    setStep(s => Math.min(WIZARD_STEPS - 1, s + 1));
  };

  const handlePrev = () => {
    setError(null);
    setStep(s => Math.max(0, s - 1));
  };

  const handleFinish = async () => {
    if (!validateStep()) return setError('Veuillez remplir les champs requis (*)');
    setError(null);
    setLoading(true);
    try {
      const sections: HomepageSectionRow[] = [
        {
          section_key: 'hero',
          title: form.heroTitle,
          subtitle: form.heroSubtitle,
          content: null,
          image_url: form.heroImageUrl ?? null,
          display_order: 0,
          is_active: true,
        },
        {
          section_key: 'features',
          title: form.featuresTitle,
          content: JSON.parse(form.featuresContent || '[]'),
          display_order: 1,
          is_active: true,
        },
        {
          section_key: 'testimonials',
          title: form.testimonialsTitle,
          content: JSON.parse(form.testimonialsContent || '[]'),
          display_order: 2,
          is_active: true,
        },
      ];

      const about = JSON.parse(form.aboutContent || '{}');
      const branding = {
        name: form.brandingName,
        logo: form.brandingLogo ?? null,
        email: form.brandingEmail,
        phone: form.brandingPhone ?? null,
        address: form.brandingAddress ?? null,
        footer_text: form.brandingFooterText ?? null,
      };

      const help = { faq: [] };

      const setupPayload = {
        sections,
        about,
        branding,
        help,
        headerLogo: form.headerLogo,
        headerMainTitle: form.headerMainTitle,
        headerSubtitle: form.headerSubtitle,
      };

      const { authData } = await initFirstParoisseAndUser(
        setupPayload,
        {
          full_name: adminFullName.trim(),
          email: adminEmail.trim(),
          password: adminPassword,
          useGravatar: useGravatar && !adminAvatarFile,
        },
        adminAvatarFile,
      );

      await queryClient.invalidateQueries({ queryKey: ['header-config'] });

      markCompleted();
      onClose();

      if (authData.session) {
        window.location.assign('/admin');
        return;
      }

      navigate('/email-confirmation-sent', {
        replace: true,
        state: { email: adminEmail.trim() },
      });
    } catch (err: unknown) {
      console.error(err);
      const e = err as { message?: string; code?: string };
      const raw =
        (typeof e?.message === 'string' && e.message !== '[object Object]' ? e.message : '') ||
        e?.code ||
        (err instanceof Error ? err.message : '');
      setError(raw || JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <DraggableModal
      open={open}
      onClose={onClose}
      draggableOnMobile={true}
      dragHandleOnly={false}
      verticalOnly={false}
      center={true}
      maxWidthClass="max-w-5xl"
      title={
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="text-2xl font-bold">Assistant de configuration</h3>
            <p className="text-sm text-muted-foreground mt-1">Configurez votre paroisse en 4 étapes</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{step + 1}</div>
            <div className="text-xs text-muted-foreground">sur 4</div>
          </div>
        </div>
      }
      headerClassName="bg-gradient-to-r from-primary/10 to-transparent"
    >
      <div className="bg-background text-foreground rounded-lg shadow-2xl w-full max-w-5xl mx-4 overflow-hidden border border-border">
        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex max-h-[calc(90vh-180px)]">
          {/* Form Panel */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                Vous avez déjà configuré une paroisse ? Vous pouvez restaurer une sauvegarde.
              </p>
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowRestoreModal(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Restaurer une sauvegarde
              </Button>
            </div>

            {/* Step 0: Landing Page */}
            {step === 0 && (
              <div className="space-y-6">
                {/* Header configuration (visible on first step so admin can set title/logo early) */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Logo du header</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.headerLogo ?? ''}
                      onChange={e => setField('headerLogo', e.target.value)}
                      placeholder="URL du logo du header..."
                    />
                    <button
                      onClick={() => triggerImageUpload('headerLogo')}
                      disabled={uploading === 'headerLogo'}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 font-medium"
                    >
                      {uploading === 'headerLogo' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload
                    </button>
                  </div>
                  {form.headerLogo && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 dark:bg-green-950 p-2 rounded">
                      ✓ Logo du header chargé
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Titre principal (header)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.headerMainTitle}
                    onChange={e => setField('headerMainTitle', e.target.value)}
                    placeholder="Ex: Paroisse Notre Dame"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Sous-titre (header)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.headerSubtitle}
                    onChange={e => setField('headerSubtitle', e.target.value)}
                    placeholder="Ex: de la Compassion"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Titre principal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.heroTitle}
                    onChange={e => setField('heroTitle', e.target.value)}
                    placeholder="Ex: Bienvenue sur notre paroisse"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Sous-titre</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.heroSubtitle}
                    onChange={e => setField('heroSubtitle', e.target.value)}
                    placeholder="Ex: Une communauté de foi et de service"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Texte bouton</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.heroButtonText}
                      onChange={e => setField('heroButtonText', e.target.value)}
                      placeholder="Ex: Découvrir"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Lien bouton</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.heroButtonLink}
                      onChange={e => setField('heroButtonLink', e.target.value)}
                      placeholder="/homepage"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Image hero</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.heroImageUrl ?? ''}
                      onChange={e => setField('heroImageUrl', e.target.value)}
                      placeholder="URL de l'image..."
                    />
                    <button
                      onClick={() => triggerImageUpload('heroImageUrl')}
                      disabled={uploading === 'heroImageUrl'}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 font-medium"
                    >
                      {uploading === 'heroImageUrl' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload
                    </button>
                  </div>
                  {form.heroImageUrl && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 dark:bg-green-950 p-2 rounded">
                      ✓ Image chargée
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-6">
                  <label className="block text-sm font-semibold mb-2">
                    Titre section activités <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.featuresTitle}
                    onChange={e => setField('featuresTitle', e.target.value)}
                    placeholder="Ex: Nos activités"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Contenu (JSON)</label>
                  <textarea
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm h-32"
                    value={form.featuresContent}
                    onChange={e => setField('featuresContent', e.target.value)}
                    placeholder="[{...}]"
                  />
                </div>
              </div>
            )}

            {/* Step 1: About */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Contenu "À Propos" <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Format JSON pour stocker l'historique, la mission, les valeurs et l'équipe
                  </p>
                  <textarea
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm h-96"
                    value={form.aboutContent}
                    onChange={e => setField('aboutContent', e.target.value)}
                    placeholder="{...}"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Branding */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Nom de la paroisse <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.brandingName}
                      onChange={e => setField('brandingName', e.target.value)}
                      placeholder="Ma Paroisse"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Email contact <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.brandingEmail}
                      onChange={e => setField('brandingEmail', e.target.value)}
                      placeholder="contact@paroisse.local"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Logo</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.brandingLogo ?? ''}
                      onChange={e => setField('brandingLogo', e.target.value)}
                      placeholder="URL du logo..."
                    />
                    <button
                      onClick={() => triggerImageUpload('brandingLogo')}
                      disabled={uploading === 'brandingLogo'}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 font-medium"
                    >
                      {uploading === 'brandingLogo' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload
                    </button>
                  </div>
                  {form.brandingLogo && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 dark:bg-green-950 p-2 rounded">
                      ✓ Logo chargé
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Téléphone</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.brandingPhone}
                    onChange={e => setField('brandingPhone', e.target.value)}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Adresse</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.brandingAddress}
                    onChange={e => setField('brandingAddress', e.target.value)}
                    placeholder="123 rue de la Paix, 75000 Paris"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Texte footer</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.brandingFooterText}
                    onChange={e => setField('brandingFooterText', e.target.value)}
                    placeholder="© Ma Paroisse 2026"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Premier compte administrateur */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-1">Compte administrateur</h4>
                  <p className="text-sm text-muted-foreground">
                    Créez le premier utilisateur (super administrateur de cette paroisse). Vous pourrez inviter d’autres membres ensuite.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={adminFullName}
                    onChange={e => setAdminFullName(e.target.value)}
                    placeholder="Ex: Marie Dupont"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="admin@exemple.fr"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <PasswordField
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="Au moins 6 caractères"
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum 6 caractères (exigence Supabase).</p>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="setup-gravatar"
                    checked={useGravatar}
                    disabled={!!adminAvatarFile}
                    onCheckedChange={c => setUseGravatar(c === true)}
                  />
                  <label htmlFor="setup-gravatar" className="text-sm cursor-pointer">
                    Utiliser Gravatar pour la photo de profil (si pas d’image ci-dessous)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Photo de profil (optionnel)</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => adminAvatarInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm"
                    >
                      <Camera className="h-4 w-4" />
                      Choisir une image
                    </button>
                    {adminAvatarPreview && (
                      <img src={adminAvatarPreview} alt="" className="h-16 w-16 rounded-full object-cover border border-border" />
                    )}
                    {!adminAvatarPreview && (
                      <UserCircle2 className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    ref={adminAvatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0] ?? null;
                      setAdminAvatarFile(file);
                      setUseGravatar(false);
                      if (file) {
                        const r = new FileReader();
                        r.onload = () => setAdminAvatarPreview(String(r.result));
                        r.readAsDataURL(file);
                      } else {
                        setAdminAvatarPreview(null);
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="w-80 border-l border-border p-8 bg-muted/30 overflow-y-auto">
            <h5 className="font-bold text-lg mb-6">Aperçu</h5>

            {step === 0 && (
              <div className="space-y-4">
                <div className="p-4 bg-background rounded-lg border border-border">
                  <h3 className="text-xl font-bold text-foreground">{form.heroTitle || '(titre vide)'}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{form.heroSubtitle || '(sous-titre vide)'}</p>
                  {form.heroImageUrl && (
                    <img src={form.heroImageUrl} alt="hero" className="mt-4 w-full h-32 object-cover rounded" />
                  )}
                  <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded font-medium text-sm">
                    {form.heroButtonText || 'Bouton'}
                  </button>
                </div>

                <div className="p-4 bg-background rounded-lg border border-border">
                  <h4 className="font-semibold text-foreground">{form.featuresTitle || '(titre activités)'}</h4>
                  <pre className="text-xs mt-2 overflow-auto max-h-32 text-muted-foreground">
                    {form.featuresContent}
                  </pre>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="p-4 bg-background rounded-lg border border-border">
                <h4 className="font-semibold text-foreground mb-2">À Propos</h4>
                <pre className="text-xs overflow-auto max-h-64 text-muted-foreground">
                  {form.aboutContent}
                </pre>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {form.brandingLogo && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Logo</p>
                    <img src={form.brandingLogo} alt="logo" className="w-24 h-24 object-contain" />
                  </div>
                )}
                <div className="p-4 bg-background rounded-lg border border-border space-y-2">
                  <p className="font-bold text-foreground">{form.brandingName || '(nom vide)'}</p>
                  <p className="text-sm text-muted-foreground break-all">{form.brandingEmail}</p>
                  {form.brandingPhone && (
                    <p className="text-sm text-muted-foreground">{form.brandingPhone}</p>
                  )}
                  {form.brandingAddress && (
                    <p className="text-sm text-muted-foreground">{form.brandingAddress}</p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground p-3 bg-background rounded-lg border border-border">
                  {form.brandingFooterText}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="p-4 bg-background rounded-lg border border-border space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Administrateur</p>
                  <p className="font-medium text-foreground">{adminFullName.trim() || '(nom)'}</p>
                  <p className="text-sm text-muted-foreground break-all">{adminEmail.trim() || form.brandingEmail}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Après validation, la paroisse et le contenu sont enregistrés, puis ce compte est créé.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-border p-6 flex items-center justify-between bg-muted/30">
          <div>
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="px-6 py-2 border border-border rounded-lg text-foreground hover:bg-muted font-medium transition"
              >
                ← Précédent
              </button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Les champs avec <span className="text-red-500">*</span> sont obligatoires
          </div>
          <div>
            {step < WIZARD_STEPS - 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition"
              >
                Suivant →
              </button>
            )}
            {step === WIZARD_STEPS - 1 && (
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition"
              >
                {loading ? 'Enregistrement...' : '✓ Terminer'}
              </button>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const field = (e.target as any)?.dataset?.field as ImageField;
            if (field) handleImageUpload(e, field);
          }}
        />

        <RestoreFromFileModal
          open={showRestoreModal}
          onOpenChange={setShowRestoreModal}
          onRestoreSuccess={() => {
            onClose();
            markCompleted();
          }}
        />
      </div>
    </DraggableModal>
  );
}
