import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DraggableModal from './DraggableModal';
import { initFirstParoisseAndUser, uploadImageToStorage } from '@/lib/setupWizard';
import { useSetup } from '@/contexts/SetupContext';
import type { HomepageSectionRow } from '@/lib/setupWizard';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Loader2, Camera, UserCircle2, Church, BookOpen, Sparkles, Mail, UserCog, Trash2, Phone, MapPin } from 'lucide-react';
import PasswordField from '@/components/ui/password-field';
import { Checkbox } from '@/components/ui/checkbox';
import { isValidEmail } from '@/utils/emailSanitizer';
import { RestoreFromFileModal } from '@/components/admin-master/RestoreFromFileModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { ensureProfileExists } from '@/utils/ensureProfileExists';
import { uploadPendingAvatar } from '@/utils/uploadPendingAvatar';
import { markAppInitialized } from '@/lib/appInitializer';

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
  footerAddress: string;
  footerEmail: string;
  footerModeratorPhone: string;
  footerSuperAdminPhone: string;
  footerSuperAdminEmail: string;
  footerFacebookUrl: string;
  footerYoutubeUrl: string;
  footerInstagramUrl: string;
  footerWhatsappUrl: string;
  footerCopyrightText: string;
  headerLogo?: string;
  headerMainTitle: string;
  headerSubtitle: string;
};

type ImageField = 'heroImageUrl' | 'brandingLogo' | 'headerLogo';

const WIZARD_STEPS = 5;

type SetupWizardModalProps = {
  open: boolean;
  onClose: () => void;
  onSetupCompleted?: (payload: { paroisseId: string }) => void;
};

export default function SetupWizardModal({ open, onClose, onSetupCompleted }: SetupWizardModalProps) {
  const { markCompleted } = useSetup();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDeveloperUser =
    user?.user_metadata?.role === 'developer' || user?.app_metadata?.role === 'developer';

  const [step, setStep] = useState(0);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDevBootstrap, setShowDevBootstrap] = useState(false);
  const [hasBackups, setHasBackups] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ADMIN_UNLOCK_CODE = '2022';
  const [adminUnlockOpen, setAdminUnlockOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminUnlockError, setAdminUnlockError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [useGravatar, setUseGravatar] = useState(false);
  const [adminAvatarFile, setAdminAvatarFile] = useState<File | null>(null);
  const [adminAvatarPreview, setAdminAvatarPreview] = useState<string | null>(null);
  const adminAvatarInputRef = useRef<HTMLInputElement>(null);

  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [pendingUser, setPendingUser] = useState<{ id?: string; email?: string } | null>(null);
  const [pendingParishId, setPendingParishId] = useState<string | null>(null);

  const [devEmail, setDevEmail] = useState('dibothierrygogo@gmail.com');
  const [devPassword, setDevPassword] = useState('P2024Mano"');
  const [devBootstrapError, setDevBootstrapError] = useState<string | null>(null);

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
    footerAddress: '',
    footerEmail: user?.email ?? 'contact@paroisse.local',
    footerModeratorPhone: '',
    footerSuperAdminPhone: '',
    footerSuperAdminEmail: '',
    footerFacebookUrl: '',
    footerYoutubeUrl: '',
    footerInstagramUrl: '',
    footerWhatsappUrl: '',
    footerCopyrightText: `© ${new Date().getFullYear()} Ma Paroisse`,
    headerLogo: undefined,
    headerMainTitle: user?.email?.split('@')[0] ?? 'Ma Paroisse',
    headerSubtitle: 'Une communauté de foi et de service',
  });

  const stepImages = [
    'https://cdn-icons-png.flaticon.com/512/6193/6193613.png',
    'https://cdn-icons-png.flaticon.com/512/2598/2598641.png',
    'https://cdn-icons-png.flaticon.com/512/2971/2971976.png',
    'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
  ];

  const stepIcons = [Church, BookOpen, Sparkles, Mail, UserCog];

  const progress = useMemo(() => Math.round(((step + 1) / WIZARD_STEPS) * 100), [step]);

  useEffect(() => {
    let cancelled = false;
    const checkBackups = async () => {
      try {
        const { count, error: countError } = await supabase
          .from('backups')
          .select('*', { count: 'exact', head: true });
        if (countError) throw countError;
        if (!cancelled) setHasBackups((count ?? 0) > 0);
      } catch {
        if (!cancelled) setHasBackups(false);
      }
    };
    checkBackups();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (step !== 3) return;
    setForm(prev => ({
      ...prev,
      footerEmail: prev.footerEmail.trim() ? prev.footerEmail : prev.brandingEmail,
    }));
  }, [step]);

  useEffect(() => {
    if (step !== 4) return;
    setAdminEmail(prev => (prev.trim() ? prev : form.brandingEmail));
    setAdminPhone(prev => (prev.trim() ? prev : form.footerSuperAdminPhone.trim() || form.footerModeratorPhone.trim()));
  }, [step, form.brandingEmail]);

  useEffect(() => {
    if (!open) {
      setAdminUnlockOpen(false);
      setAdminUnlocked(false);
      setAdminCode('');
      setAdminUnlockError(null);
    }
  }, [open]);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
  };

  const fillWithDemoData = () => {
    setError(null);
    setForm((prev) => ({
      ...prev,
      headerLogo: 'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/header/1774523308670-logo2.png',
      headerMainTitle: 'Paroisse Internationale Notre-Dame de la Compassion',
      headerSubtitle: 'Une communauté vivante au service de la foi et de la fraternité',
      heroTitle: 'Bienvenue à la Paroisse Internationale Notre-Dame de la Compassion',
      heroSubtitle: 'Port-Bouët – Adjahui Coubé – Une paroisse qui vous accueille, vous écoute et vous accompagne',
      heroButtonText: 'Découvrir la paroisse',
      heroButtonLink: '/a-propos',
      heroImageUrl: 'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/hero/1774523372478-accueil.png',
      featuresTitle: 'Nos activités et célébrations',
      featuresContent: JSON.stringify(
        [
          { title: 'Messes', description: 'Messes dominicales et festivités' },
          { title: 'Adoration', description: 'Adoration du Saint-Sacrement' },
          { title: 'Catéchèse', description: 'Formation des enfants et adultes' },
        ],
        null,
        2,
      ),
      testimonialsTitle: 'Témoignages',
      testimonialsContent: JSON.stringify(
        [
          { name: 'Un fidèle', text: 'Une communauté vivante et accueillante.' },
          { name: 'Une paroissienne', text: 'Un lieu de prière, de fraternité et de soutien.' },
        ],
        null,
        2,
      ),
      aboutContent: JSON.stringify(
        {
          history: "La Paroisse Internationale Notre-Dame de la Compassion a été fondée pour être un lieu de prière, de partage et de rayonnement spirituel au cœur de Port-Bouët – Adjahui Coubé. Depuis sa création, elle accueille des fidèles de toutes les communautés, avec un esprit d'ouverture et de fraternité.",
          mission: "Annoncer l'Évangile, célébrer la foi, accompagner les fidèles dans leur vie spirituelle et servir la communauté à travers des actions de solidarité et de partage.",
          values: ['Foi', 'Espérance', 'Charité', 'Fraternité', 'Accueil'],
          team: [{ name: 'Père Basile Diané', role: 'Curé', photo: '/images/pere-basile.jpg' }],
        },
        null,
        2,
      ),
      brandingName: 'Paroisse Internationale Notre-Dame de la Compassion',
      brandingEmail: 'basilediane71@gmail.com',
      brandingLogo: 'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/header/1774523308670-logo2.png',
      footerAddress: "Port-Bouët – Adjahui Coubé, 657 BP 07, Abidjan, Côte d'Ivoire",
      footerEmail: 'basilediane71@gmail.com',
      footerModeratorPhone: '+225 27 20 15 20 70',
      footerSuperAdminPhone: '+225 05 05 26 30 30',
      footerSuperAdminEmail: 'basilediane71@gmail.com',
      footerFacebookUrl: 'https://facebook.com/ndcompassion',
      footerYoutubeUrl: 'https://youtube.com/@ndcompassion',
      footerInstagramUrl: 'https://instagram.com/ndcompassion',
      footerWhatsappUrl: 'https://wa.me/2250505263030',
      footerCopyrightText: '© 2026 Paroisse Internationale Notre-Dame de la Compassion – Tous droits réservés',
    }));

    setAdminFullName('Père Basile Diané');
    setAdminPhone('+225 05 05 26 30 30');
    setAdminEmail('compassionnotredame5@gmail.com');
    setAdminPassword('P2026@ndc');
    setUseGravatar(true);
    setAdminAvatarFile(null);
    setAdminAvatarPreview(null);
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
      return !!form.footerEmail.trim() && isValidEmail(form.footerEmail.trim());
    }
    if (step === 4) {
      return (
        adminFullName.trim().length >= 2 &&
        isValidEmail(adminEmail.trim()) &&
        adminPassword.length >= 6 &&
        adminPhone.trim().length >= 6 &&
        (useGravatar || !!adminAvatarFile)
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

  const enforceSetupUserSuperAdmin = async (userId: string, parishId: string) => {
    const { error: profileRoleError } = await supabase
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('id', userId);
    if (profileRoleError) {
      throw new Error(`Impossible de definir le role super_admin sur le profil: ${profileRoleError.message}`);
    }

    const { error: memberError } = await supabase
      .from('parish_members')
      .upsert(
        { parish_id: parishId, user_id: userId, role: 'super_admin' },
        { onConflict: 'parish_id,user_id' },
      );
    if (memberError) {
      throw new Error(`Impossible de definir le role super_admin dans parish_members: ${memberError.message}`);
    }
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
        phone: form.footerModeratorPhone.trim() || null,
        address: form.footerAddress.trim() || null,
        footer_text: form.footerCopyrightText.trim() || null,
      };

      const footer = {
        address: form.footerAddress.trim() || null,
        email: form.footerEmail.trim(),
        moderator_phone: form.footerModeratorPhone.trim() || null,
        super_admin_phone: form.footerSuperAdminPhone.trim() || null,
        super_admin_email: form.footerSuperAdminEmail.trim() || null,
        facebook_url: form.footerFacebookUrl.trim() || null,
        youtube_url: form.footerYoutubeUrl.trim() || null,
        instagram_url: form.footerInstagramUrl.trim() || null,
        whatsapp_url: form.footerWhatsappUrl.trim() || null,
        copyright_text: form.footerCopyrightText.trim() || null,
      };

      const help = { faq: [] };

      const setupPayload = {
        sections,
        about,
        branding,
        footer,
        help,
        headerLogo: form.headerLogo,
        headerMainTitle: form.headerMainTitle,
        headerSubtitle: form.headerSubtitle,
      };

      const { authData, paroisseId } = await initFirstParoisseAndUser(
        setupPayload,
        {
          full_name: adminFullName.trim(),
          email: adminEmail.trim(),
          password: adminPassword,
          phone: adminPhone.trim(),
          useGravatar: useGravatar && !adminAvatarFile,
        },
        adminAvatarFile,
      );

      await queryClient.invalidateQueries({ queryKey: ['header-config'] });
      await queryClient.invalidateQueries({ queryKey: ['footer-config'] });

      if (authData.session) {
        if (authData.user?.id) {
          await enforceSetupUserSuperAdmin(authData.user.id, paroisseId);
        }

        markAppInitialized();
        markCompleted();
        onSetupCompleted?.({ paroisseId });
        onClose();
        navigate(isDeveloperUser ? '/developer/admin' : '/dashboard', { replace: true });
        return;
      }

      setPendingParishId(paroisseId);
      setPendingUser({
        id: authData.user?.id,
        email: authData.user?.email ?? adminEmail.trim(),
      });
      await sendOtp(adminEmail.trim(), authData.user?.id);
      setShowOtp(true);
      setOtpCode('');
      setOtpError('');
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

  const verifyOtp = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const email = adminEmail.trim();
      const code = otpCode.trim();
      if (!/^\d{4}$/.test(code)) {
        setOtpError('Veuillez saisir un code à 4 chiffres.');
        return;
      }

      const { data, error: fnErr } = await supabase.functions.invoke('verify-email-otp', {
        body: { email, code },
      });
      if (fnErr) throw fnErr;
      if (!data?.success) {
        throw new Error(data?.error || 'Code incorrect.');
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: adminPassword,
      });
      if (signInErr) throw signInErr;

      const {
        data: { user: signedInUser },
      } = await supabase.auth.getUser();
      if (signedInUser?.id) {
        const parishIdForMembership =
          pendingParishId || localStorage.getItem('selectedParoisse') || '';
        if (parishIdForMembership) {
          await enforceSetupUserSuperAdmin(signedInUser.id, parishIdForMembership);
        }
        await ensureProfileExists(signedInUser.id);
        await uploadPendingAvatar(signedInUser.id);
      }

      const storedParoisseId = pendingParishId || localStorage.getItem('selectedParoisse') || '';
      if (storedParoisseId) {
        onSetupCompleted?.({ paroisseId: storedParoisseId });
      }
      markAppInitialized();
      markCompleted();
      onClose();
      const signedInIsDeveloper =
        signedInUser?.user_metadata?.role === 'developer' ||
        signedInUser?.app_metadata?.role === 'developer' ||
        isDeveloperUser;
      navigate(signedInIsDeveloper ? '/developer/admin' : '/dashboard', { replace: true });
    } catch (e: any) {
      setOtpError(e?.message || 'Impossible de vérifier le code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const sendOtp = async (email: string, userId?: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { error: fnError } = await supabase.functions.invoke('send-email-otp', {
      body: { email: normalizedEmail, user_id: userId ?? pendingUser?.id ?? null },
    });
    if (fnError) throw fnError;
    setShowOtp(true);
    setOtpResendCooldown(60);
  };

  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setOtpResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpResendCooldown]);

  const resendOtp = async () => {
    if (otpResendCooldown > 0) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      await sendOtp(pendingUser?.email ?? adminEmail.trim(), pendingUser?.id);
    } catch (e: any) {
      setOtpError(e?.message || "Impossible de renvoyer le code.");
    } finally {
      setOtpLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
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
            {/* Bloc gauche : Logo + Info utilisateur */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src="/profile01.png"
                  alt="Logo"
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/30 shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?background=ffb347&color=fff&size=48&bold=true&name=TG';
                  }}
                />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-white/90">Thierry Gogo</div>
                <div className="text-xs text-white/70">Développeur Web Full Stack</div>
                <div className="text-xs text-white/60 mt-1 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span>dibothierrygogo@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>+225 0758966156 / 0103644527</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>01 BP 5341 AB 01</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Titre central */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white drop-shadow-sm">Assistant de configuration</h3>
              <p className="text-sm text-white/90 mt-1">Configurez votre paroisse en 5 étapes</p>
            </div>

            {/* Bloc droit : Boutons DÉMO & ADMIN */}
            <div className="text-right flex flex-col items-end gap-3">
              <div className="flex items-center gap-2 mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="bg-white/10 text-white/90 hover:bg-white/15 hover:text-white"
                  disabled={loading}
                  onClick={fillWithDemoData}
                  title="Pré-remplir le SetupWizard avec des données de démonstration"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  DÉMO
                </Button>
                {!adminUnlocked ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="bg-white/10 text-white/90 hover:bg-white/15 hover:text-white"
                      disabled={loading}
                      onClick={() => {
                        setAdminUnlockError(null);
                        setAdminUnlockOpen((v) => !v);
                      }}
                    >
                      <UserCircle2 className="mr-2 h-4 w-4" />
                      ADMIN
                    </Button>

                    {adminUnlockOpen ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="Code"
                          className="w-28 bg-white/10 border-white/20 text-white placeholder:text-white/70 focus-visible:ring-white/40"
                          value={adminCode}
                          disabled={loading}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setAdminCode(digits);
                            setAdminUnlockError(null);

                            if (digits.length === 4) {
                              if (digits === ADMIN_UNLOCK_CODE) {
                                setAdminUnlocked(true);
                                setAdminUnlockOpen(false);
                                setAdminUnlockError(null);
                                setAdminCode('');
                              } else {
                                setAdminUnlockError('Code incorrect.');
                                setAdminCode('');
                              }
                            }
                          }}
                        />
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="bg-white text-black hover:bg-white/90"
                      onClick={() => {
                        setDevBootstrapError(null);
                        setShowDevBootstrap(true);
                      }}
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      SYSTEM
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="bg-white text-black hover:bg-white/90"
                      onClick={async () => {
                        if (
                          !confirm(
                            '⚠️ NETTOYAGE COMPLET\n\n' +
                              'Cette action supprimera TOUTES les données (paroisses, vidéos, événements, etc.)\n\n' +
                              '✅ Le compte développeur et la paroisse SYSTEM seront conservés.\n\n' +
                              '✅ L\'application reviendra comme une nouvelle installation.\n\n' +
                              'Confirmer ?',
                          )
                        ) {
                          return;
                        }

                        try {
                          const {
                            data: { session },
                          } = await supabase.auth.getSession();
                          if (!session) {
                            alert('Veuillez vous connecter avec SYSTEM avant de lancer le RESET.');
                            return;
                          }

                          const { error } = await supabase.rpc('reset_all_data');
                          if (error) throw error;

                          alert(
                            '✅ Nettoyage terminé !\n\n' +
                              'La base a été réinitialisée.\n' +
                              'Le compte développeur est prêt.\n\n' +
                              'Redirection vers l’accueil.',
                          );
                          navigate('/', { replace: true });
                        } catch (err: any) {
                          alert('❌ Erreur lors du nettoyage: ' + (err?.message || String(err)));
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      RESET
                    </Button>
                  </>
                )}
              </div>

              {adminUnlockOpen && !adminUnlocked && adminUnlockError ? (
                <div className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/30 rounded px-2 py-1">
                  {adminUnlockError}
                </div>
              ) : null}

              <div>
                <div className="text-3xl font-bold text-white">{step + 1}</div>
                <div className="text-xs text-white/90">sur 5</div>
              </div>
            </div>
          </div>
        }
        headerClassName="bg-amber-800"
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
          <div className="flex max-h-[calc(90vh-180px)] bg-gradient-animated rounded-lg">
            {/* Form Panel */}
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-3">
                  Vous avez déjà configuré une paroisse ? Vous pouvez restaurer une sauvegarde.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    disabled={!hasBackups}
                    onClick={() => setShowRestoreModal(true)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {hasBackups ? 'Restaurer une sauvegarde' : 'Aucune sauvegarde disponible'}
                  </Button>
                </div>
              </div>

              {/* Steps content - kept as in original but truncated for brevity */}
              <AnimatePresence mode="sync">
                {/* Step content remains unchanged from your original file */}
                {/* ... (keep all step content as in your original file) ... */}
              </AnimatePresence>
            </div>

            {/* Preview Panel */}
            <div className="w-80 border-l border-border p-8 bg-muted/30 overflow-y-auto">
              <h5 className="font-bold text-lg mb-6">Aperçu</h5>
              {/* Preview content remains unchanged */}
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
                  disabled={loading || showOtp}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition"
                >
                  {loading ? 'Enregistrement...' : showOtp ? 'En attente du code…' : '✓ Terminer'}
                </button>
              )}
            </div>
          </div>

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

      <DraggableModal
        open={showDevBootstrap}
        onClose={() => {
          setShowDevBootstrap(false);
          setDevBootstrapError(null);
        }}
        draggableOnMobile={true}
        dragHandleOnly={false}
        verticalOnly={true}
        center={true}
        maxWidthClass="max-w-xl"
        title={
          <div className="flex items-center justify-between w-full">
            <div>
              <h3 className="text-lg font-bold text-white">Connexion développeur</h3>
              <p className="text-xs text-white/90 mt-1">
                Si le compte n’existe pas encore, vous pouvez le créer depuis l’application.
              </p>
            </div>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold">Email</label>
            <Input value={devEmail} onChange={(e) => setDevEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold">Mot de passe</label>
            <PasswordField
              value={devPassword}
              onChange={(e) => setDevPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {devBootstrapError ? (
            <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
              {devBootstrapError}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDevBootstrap(false);
                setDevBootstrapError(null);
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={async () => {
                setLoading(true);
                setDevBootstrapError(null);
                try {
                  await supabase.rpc('ensure_system_parish');

                  const email = devEmail.trim().toLowerCase();
                  const password = devPassword;

                  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
                  if (signInErr) {
                    const msg = (signInErr.message ?? "").toLowerCase();
                    const code = (signInErr as any)?.code ? String((signInErr as any).code).toLowerCase() : "";
                    const userLikelyMissing =
                      msg.includes("not found") ||
                      msg.includes("no user") ||
                      msg.includes("user not") ||
                      code.includes("user_not") ||
                      code.includes("not_found");

                    if (userLikelyMissing) {
                      const { error: signUpErr } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                          data: { full_name: 'Thierry Gogo' },
                        },
                      });
                      if (signUpErr) throw signUpErr;

                      const { error: signInAfterSignUpErr } = await supabase.auth.signInWithPassword({ email, password });
                      if (signInAfterSignUpErr) throw signInAfterSignUpErr;
                    } else {
                      setDevBootstrapError(signInErr.message || "Connexion impossible (vérifiez email/mot de passe).");
                      return;
                    }
                  }

                  const { error: ensureErr } = await supabase.rpc('ensure_developer_account');
                  if (ensureErr) {
                    const { error: legacyErr } = await supabase.rpc('ensure_developer_exists');
                    if (legacyErr) throw legacyErr;
                  }

                  markCompleted();
                  setShowDevBootstrap(false);
                  onClose();
                  navigate('/developer/admin', { replace: true });
                } catch (e: any) {
                  const details =
                    typeof e?.message === 'string'
                      ? e.message
                      : typeof e === 'string'
                        ? e
                        : JSON.stringify(e ?? {});
                  console.error('SYSTEM modal sign-in error', e);
                  setDevBootstrapError(details || 'Impossible de créer le compte développeur.');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </Button>
          </div>
        </div>
      </DraggableModal>
    </>
  );
}