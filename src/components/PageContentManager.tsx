import React, { useState, useEffect } from 'react';
import DraggableModal from '@/components/DraggableModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/supabase/storage';
import { Trash2, RotateCcw, Save, ImageIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { MAX_HERO_IMAGES } from '@/lib/pageHeroImages';
import { useQueryClient } from '@tanstack/react-query';

export interface PageContentManagerData {
  heroTitle: string;
  heroSubtitle: string;
  /** Première image (compatibilité) */
  heroImage: string;
  /** Images ordonnées (jusqu'à 5) ; prioritaire si défini */
  heroImages?: string[];
}

export interface PageContentManagerProps {
  page: string;
  open: boolean;
  onClose: () => void;
  currentData: PageContentManagerData;
  onSaved?: (data: PageContentManagerData) => void;
  path: string;
}

export const PAGE_CONFIG: Record<
  string,
  {
    path: string;
    label: string;
    deleteLabel: string;
    table: string;
    defaultHero: PageContentManagerData;
  }
> = {
  videos: {
    path: '/videos',
    label: 'Vidéos',
    deleteLabel: 'Supprimer toutes les vidéos',
    table: 'videos',
    defaultHero: { heroTitle: 'Vidéos', heroSubtitle: 'Retrouvez nos messes et enseignements', heroImage: '', heroImages: [] },
  },
  homilies: {
    path: '/homilies',
    label: 'Homélies',
    deleteLabel: 'Supprimer toutes les homélies',
    table: 'homilies',
    defaultHero: { heroTitle: 'Les Homélies', heroSubtitle: 'Écoutez les prédications de nos prêtres', heroImage: '', heroImages: [] },
  },
  events: {
    path: '/evenements',
    label: 'Événements',
    deleteLabel: 'Supprimer tous les événements',
    table: 'events',
    defaultHero: { heroTitle: 'Événements', heroSubtitle: 'Ne manquez aucun rendez-vous', heroImage: '', heroImages: [] },
  },
  gallery: {
    path: '/galerie',
    label: 'Galerie',
    deleteLabel: 'Supprimer toutes les images de la galerie',
    table: 'gallery_images',
    defaultHero: { heroTitle: 'Galerie', heroSubtitle: 'Nos photos et moments', heroImage: '', heroImages: [] },
  },
  prayers: {
    path: '/prayers',
    label: 'Intentions de prière',
    deleteLabel: 'Supprimer toutes les intentions de prière',
    table: 'prayer_intentions',
    defaultHero: { heroTitle: 'Intentions de prière', heroSubtitle: 'Confiez vos intentions', heroImage: '', heroImages: [] },
  },
  about: {
    path: '/a-propos',
    label: 'À propos',
    deleteLabel: '',
    table: '',
    defaultHero: { heroTitle: 'À propos', heroSubtitle: 'Découvrez notre paroisse', heroImage: '', heroImages: [] },
  },
  donate: {
    path: '/donate',
    label: 'Faire un don',
    deleteLabel: '',
    table: '',
    defaultHero: { heroTitle: 'Faire un don', heroSubtitle: 'Soutenez notre mission', heroImage: '', heroImages: [] },
  },
  receipts: {
    path: '/receipts',
    label: 'Reçus',
    deleteLabel: '',
    table: '',
    defaultHero: { heroTitle: 'Reçus de dons', heroSubtitle: 'Consultez et imprimez vos reçus', heroImage: '', heroImages: [] },
  },
};

function buildHeroImagesFromData(d: PageContentManagerData): string[] {
  if (d.heroImages?.length) {
    return d.heroImages
      .map((x) => (typeof x === 'string' ? x.trim() : ''))
      .filter(Boolean)
      .slice(0, MAX_HERO_IMAGES);
  }
  const one = d.heroImage?.trim();
  return one ? [one] : [];
}

export default function PageContentManager({
  page,
  open,
  onClose,
  currentData,
  onSaved,
  path,
}: PageContentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [heroTitle, setHeroTitle] = useState(currentData.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(currentData.heroSubtitle);
  const [heroImages, setHeroImages] = useState<string[]>(() => buildHeroImagesFromData(currentData));
  const [heroUrlDraft, setHeroUrlDraft] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmTable, setDeleteConfirmTable] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  const config = PAGE_CONFIG[page] ?? {
    path,
    label: page,
    deleteLabel: '',
    table: '',
    defaultHero: { heroTitle: '', heroSubtitle: '', heroImage: '', heroImages: [] },
  };

  useEffect(() => {
    if (!open) return;
    // Initialize once per open cycle. Do not resync while editing,
    // otherwise typed URL / uploaded image gets wiped by parent rerenders.
    setHeroTitle(currentData.heroTitle);
    setHeroSubtitle(currentData.heroSubtitle);
    setHeroImages(buildHeroImagesFromData(currentData));
    setHeroUrlDraft('');
    setDeleteConfirmTable(null);
    setDeleteConfirmText('');
  }, [open]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || heroImages.length >= MAX_HERO_IMAGES) return;
    setUploading(true);
    try {
      const res = await uploadFile(file, `hero-images/${Date.now()}_${file.name}`);
      if (res?.publicUrl) {
        setHeroImages((prev) => [...prev, res.publicUrl].slice(0, MAX_HERO_IMAGES));
        // Remplit automatiquement le champ URL pour copie/édition.
        setHeroUrlDraft(res.publicUrl);
        toast({ title: 'Image téléversée' });
      } else {
        toast({ title: 'Erreur', description: 'Échec de l\'upload', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible d\'uploader l\'image', variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const appendHeroUrl = () => {
    const u = heroUrlDraft.trim();
    if (!u || heroImages.length >= MAX_HERO_IMAGES) return;
    setHeroImages((prev) => {
      if (prev.includes(u)) return prev;
      return [...prev, u].slice(0, MAX_HERO_IMAGES);
    });
  };

  const moveHeroImage = (index: number, dir: -1 | 1) => {
    setHeroImages((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const t = next[index]!;
      next[index] = next[j]!;
      next[j] = t;
      return next;
    });
  };

  const removeHeroImageAt = (index: number) => {
    setHeroImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApply = async () => {
    setSaving(true);
    try {
      const urls = heroImages.map((u) => u.trim()).filter(Boolean).slice(0, MAX_HERO_IMAGES);
      const { error } = await (supabase as any)
        .from('page_hero_banners')
        .upsert(
          {
            path: config.path,
            title: heroTitle || null,
            subtitle: heroSubtitle || null,
            image_url: urls[0] ?? null,
            images_order: urls,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'path' }
        );
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['page-hero', config.path] });
      toast({ title: 'Modifications enregistrées' });
      onSaved?.({
        heroTitle,
        heroSubtitle,
        heroImage: urls[0] ?? '',
        heroImages: urls,
      });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!config.table || deleteConfirmText.trim().toUpperCase() !== 'SUPPRIMER') return;
    try {
      const { error } = await (supabase as any).from(config.table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      toast({ title: 'Contenu supprimé', variant: 'destructive' });
      setDeleteConfirmTable(null);
      setDeleteConfirmText('');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    }
  };

  const handleResetDefaults = () => {
    setHeroTitle(config.defaultHero.heroTitle);
    setHeroSubtitle(config.defaultHero.heroSubtitle);
    setHeroImages(buildHeroImagesFromData(config.defaultHero));
    setResetting(true);
    toast({ title: 'Valeurs par défaut chargées (cliquez sur Appliquer pour enregistrer)' });
    setTimeout(() => setResetting(false), 500);
  };

  return (
    <DraggableModal
      open={open}
      onClose={onClose}
      title={`Gestion du contenu – ${config.label}`}
      center
      maxWidthClass="max-w-xl"
      initialY={40}
      minHeight="320px"
    >
      <div id="page-content-manager-desc" className="space-y-6" aria-describedby="page-content-manager-desc">
          {/* 1. HERO BANNER */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">Hero Banner</h3>
            <div className="space-y-3">
              <div>
                <Label>Titre</Label>
                <Input
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="Titre du bandeau"
                />
              </div>
              <div>
                <Label>Sous-titre</Label>
                <Input
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  placeholder="Sous-titre"
                />
              </div>
              <div className="space-y-2">
                <Label>Images du bandeau (max {MAX_HERO_IMAGES})</Label>
                <p className="text-xs text-muted-foreground">
                  Plusieurs images&nbsp;: carrousel manuel sur la page. Une seule image&nbsp;: affichage fixe.
                </p>
                {heroImages.length === 0 && (
                  <p className="text-xs text-muted-foreground">Aucune image — fond sans photo.</p>
                )}
                <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {heroImages.map((url, index) => (
                    <li
                      key={`${url}-${index}`}
                      className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2"
                    >
                      <img src={url} alt="" className="h-12 w-16 object-cover rounded shrink-0" />
                      <span className="flex-1 text-xs truncate font-mono text-muted-foreground">{url}</span>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          className="p-0.5 rounded hover:bg-muted disabled:opacity-40"
                          disabled={index === 0}
                          onClick={() => moveHeroImage(index, -1)}
                          aria-label="Monter"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="p-0.5 rounded hover:bg-muted disabled:opacity-40"
                          disabled={index === heroImages.length - 1}
                          onClick={() => moveHeroImage(index, 1)}
                          aria-label="Descendre"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive shrink-0"
                        onClick={() => removeHeroImageAt(index)}
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <Input
                    value={heroUrlDraft}
                    onChange={(e) => setHeroUrlDraft(e.target.value)}
                    placeholder="URL d’image…"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={appendHeroUrl}
                    disabled={!heroUrlDraft.trim() || heroImages.length >= MAX_HERO_IMAGES}
                  >
                    Ajouter URL
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="hero-image-upload"
                    onChange={handleImageUpload}
                    disabled={uploading || heroImages.length >= MAX_HERO_IMAGES}
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <label
                      htmlFor="hero-image-upload"
                      className={`cursor-pointer flex items-center gap-2 ${
                        uploading || heroImages.length >= MAX_HERO_IMAGES ? 'pointer-events-none opacity-50' : ''
                      }`}
                    >
                      <ImageIcon className="h-4 w-4" />
                      {uploading ? '…' : 'Téléverser'}
                    </label>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* 2. CONTENU DE LA PAGE */}
          {config.table && (
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">Contenu de la page</h3>
              {!deleteConfirmTable ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteConfirmTable(config.table)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {config.deleteLabel}
                </Button>
              ) : (
                <div className="space-y-2 p-3 rounded-lg border border-destructive/50 bg-destructive/5">
                  <p className="text-sm text-foreground">
                    Confirmez en tapant <strong>SUPPRIMER</strong> ci-dessous.
                  </p>
                  <Input
                    placeholder="SUPPRIMER"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="border-destructive"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAll}
                      disabled={deleteConfirmText.trim().toUpperCase() !== 'SUPPRIMER'}
                    >
                      Confirmer la suppression
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setDeleteConfirmTable(null); setDeleteConfirmText(''); }}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 3. RÉINITIALISATION */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">Réinitialisation</h3>
            <Button
              type="button"
              variant="outline"
              className="w-full border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              onClick={handleResetDefaults}
              disabled={resetting}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser aux valeurs par défaut
            </Button>
          </section>

          {/* 4. SAUVEGARDE */}
          <section className="pt-2 border-t">
            <Button type="button" className="w-full" onClick={handleApply} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Enregistrement…' : 'Appliquer les modifications'}
            </Button>
          </section>
        </div>
    </DraggableModal>
  );
}
