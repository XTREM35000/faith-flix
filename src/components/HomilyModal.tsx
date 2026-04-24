import React, { useEffect, useMemo, useRef, useState } from 'react';
import DraggableModal from './DraggableModal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { isOfficiantTitleStubRow } from '@/lib/supabase/culteApi';
import type { OfficiantRow } from '@/types/culte';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, Video, Image as ImageIcon } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (homily: HomilyData | null) => void;
  homilyId?: string | null;
}

interface HomilyData {
  id?: string;
  title: string;
  priest_name: string;
  description: string | null;
  homily_date: string;
  video_url: string | null;
  image_url: string | null;
  duration_minutes: number | null;
  category_id?: string | null;
  category_label?: string | null;
  officiant_id?: string | null;
  video_storage_path?: string | null;
  thumbnail_storage_path?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface OfficiantOption {
  id: string;
  name: string;
}

const DEFAULT_CATEGORIES = ['Dimanche', 'Fete', 'Careme', 'Avent', 'Mariage', 'Funerailles'];
const DEFAULT_OFFICIANT_NAME = 'Père Basile Diane';

const HomilyModal: React.FC<Props> = ({ open, onClose, onSaved, homilyId = null }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [officiants, setOfficiants] = useState<OfficiantOption[]>([]);
  const [supportsCategoryId, setSupportsCategoryId] = useState(true);
  const [supportsCategoryLabel, setSupportsCategoryLabel] = useState(true);
  const [supportsOfficiantId, setSupportsOfficiantId] = useState(true);
  const [supportsVideoStoragePath, setSupportsVideoStoragePath] = useState(true);
  const [supportsThumbnailStoragePath, setSupportsThumbnailStoragePath] = useState(true);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailFileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    title: '',
    category_id: '',
    category_label: '',
    officiant_id: '',
    priest_name: '',
    homily_date: '',
    description: '',
    video_url: '',
    video_storage_path: '',
    image_url: '',
    thumbnail_storage_path: '',
    duration_minutes: '',
  });

  const isEditing = !!homilyId;
  const canSubmit = useMemo(() => {
    return !!form.title.trim() && !!form.homily_date && !!form.description.trim() && !loading;
  }, [form.title, form.homily_date, form.description, loading]);

  const getYouTubeEmbedUrl = (rawUrl: string): string | null => {
    const url = rawUrl.trim();
    if (!url) return null;
    const match =
      url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/i) ||
      url.match(/[?&]v=([^&]+)/i);
    const id = match?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  };

  const loadOptions = async () => {
    try {
      const { data: categoriesData } = await supabase
        .from('homilies_categories')
        .select('id,name')
        .order('name', { ascending: true });
      if (categoriesData && categoriesData.length > 0) {
        setCategories(categoriesData as CategoryOption[]);
      } else {
        setCategories(DEFAULT_CATEGORIES.map((name) => ({ id: name, name })));
      }
    } catch {
      setCategories(DEFAULT_CATEGORIES.map((name) => ({ id: name, name })));
    }

    try {
      const { data: offData } = await supabase
        .from('officiants')
        .select('id,name,title')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });
      const officiantRows = (offData || []).filter(
        (row) => !isOfficiantTitleStubRow(row as OfficiantRow),
      ) as Array<{ id: string; name?: string | null }>;
      const loaded = officiantRows.map((row) => ({
        id: row.id,
        name: row.name || 'Sans nom',
      }));
      const hasBasile = loaded.some((o) => o.name.toLowerCase().includes('basile') && o.name.toLowerCase().includes('diane'));
      if (!hasBasile) {
        loaded.unshift({ id: 'default-basile-diane', name: DEFAULT_OFFICIANT_NAME });
      }
      setOfficiants(loaded);
    } catch {
      setOfficiants([{ id: 'default-basile-diane', name: DEFAULT_OFFICIANT_NAME }]);
    }
  };

  const loadHomily = async () => {
    if (!homilyId) {
      setForm({
        title: '',
        category_id: '',
        category_label: '',
        officiant_id: 'default-basile-diane',
        priest_name: DEFAULT_OFFICIANT_NAME,
        homily_date: '',
        description: '',
        video_url: '',
        video_storage_path: '',
        image_url: '',
        thumbnail_storage_path: '',
        duration_minutes: '',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.from('homilies').select('*').eq('id', homilyId).maybeSingle();
      if (error) throw error;
      const row = data as Partial<HomilyData> | null;
      if (!row) return;
      setForm({
        title: row.title || '',
        category_id: row.category_id || '',
        category_label: row.category_label || '',
        officiant_id: row.officiant_id || '',
        priest_name: row.priest_name || '',
        homily_date: row.homily_date ? String(row.homily_date).slice(0, 10) : '',
        description: row.description || '',
        video_url: row.video_url || '',
        video_storage_path: row.video_storage_path || '',
        image_url: row.image_url || '',
        thumbnail_storage_path: row.thumbnail_storage_path || '',
        duration_minutes: row.duration_minutes ? String(row.duration_minutes) : '',
      });
    } catch (err) {
      console.error('load homily error', err);
      toast({ title: 'Erreur', description: "Impossible de charger l'homelie", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadOptions();
    void loadHomily();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, homilyId]);

  useEffect(() => {
    if (!open || isEditing) return;
    if (!form.officiant_id) {
      const basile = officiants.find((o) => o.name.toLowerCase().includes('basile') && o.name.toLowerCase().includes('diane'));
      if (basile) {
        setForm((prev) => ({ ...prev, officiant_id: basile.id, priest_name: basile.name }));
      }
    }
  }, [open, isEditing, officiants, form.officiant_id]);

  const uploadToHomiliesBucket = async (file: File, folder: 'videos' | 'thumbnails') => {
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const safe = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    const path = `${folder}/${Date.now()}_${safe}`;
    const { data, error } = await supabase.storage.from('homilies').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || (folder === 'videos' ? `video/${ext}` : `image/${ext}`),
    });
    if (error) throw error;
    const { data: publicData } = supabase.storage.from('homilies').getPublicUrl(data.path);
    return { path: data.path, publicUrl: publicData.publicUrl };
  };

  const handleVideoUpload = async (file: File) => {
    setVideoUploading(true);
    setSubmitError(null);
    try {
      const uploaded = await uploadToHomiliesBucket(file, 'videos');
      setForm((prev) => ({
        ...prev,
        video_url: uploaded.publicUrl,
        video_storage_path: uploaded.path,
      }));
      toast({ title: 'Succes', description: 'Video televersee' });
    } catch (err) {
      console.error(err);
      const msg =
        err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string'
          ? String((err as any).message)
          : "Echec de l'upload video (bucket homilies).";
      setSubmitError(msg);
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setVideoUploading(false);
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    setThumbUploading(true);
    setSubmitError(null);
    try {
      const uploaded = await uploadToHomiliesBucket(file, 'thumbnails');
      setForm((prev) => ({
        ...prev,
        image_url: uploaded.publicUrl,
        thumbnail_storage_path: uploaded.path,
      }));
      toast({ title: 'Succes', description: 'Vignette televersee' });
    } catch (err) {
      console.error(err);
      const msg =
        err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string'
          ? String((err as any).message)
          : "Echec de l'upload de la vignette.";
      setSubmitError(msg);
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setThumbUploading(false);
      if (thumbnailFileInputRef.current) thumbnailFileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!form.title.trim() || !form.homily_date || !form.description.trim()) {
      toast({
        title: 'Champs requis',
        description: 'Titre, date de predication et contenu sont obligatoires.',
        variant: 'destructive',
      });
      setSubmitError('Veuillez renseigner le titre, la date et le contenu.');
      return;
    }
    if (!isEditing && !form.video_url.trim()) {
      toast({ title: 'Champs requis', description: 'Ajoutez une video (URL ou upload).', variant: 'destructive' });
      setSubmitError('Ajoutez une video (URL ou upload).');
      return;
    }
    if (!isEditing && !form.image_url.trim()) {
      toast({ title: 'Champs requis', description: 'Ajoutez une vignette (URL ou upload).', variant: 'destructive' });
      setSubmitError('Ajoutez une vignette (URL ou upload).');
      return;
    }

    setLoading(true);
    try {
      const selectedPreacher = officiants.find((p) => p.id === form.officiant_id);
      const selectedCategory = categories.find((c) => c.id === form.category_id);
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        priest_name: (selectedPreacher?.name || form.priest_name || '').trim(),
        description: form.description.trim(),
        homily_date: form.homily_date,
        video_url: form.video_url.trim() || null,
        image_url: form.image_url.trim() || null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        updated_at: new Date().toISOString(),
      };
      if (supportsOfficiantId) payload.officiant_id = form.officiant_id && form.officiant_id !== 'default-basile-diane' ? form.officiant_id : null;
      if (supportsCategoryId) payload.category_id = selectedCategory && selectedCategory.id.length === 36 ? selectedCategory.id : null;
      if (supportsCategoryLabel) payload.category_label = selectedCategory?.name || form.category_label || null;
      if (supportsVideoStoragePath) payload.video_storage_path = form.video_storage_path || null;
      if (supportsThumbnailStoragePath) payload.thumbnail_storage_path = form.thumbnail_storage_path || null;

      if (!payload.priest_name) {
        throw new Error('Selectionnez un officiant ou renseignez son nom.');
      }

      const executeSaveWithFallback = async () => {
        console.log('📤 Données envoyées à Supabase (homilies):', {
          mode: isEditing ? 'update' : 'insert',
          id: homilyId ?? null,
          payload,
        });

        if (isEditing) {
          const { data, error } = await supabase
            .from('homilies')
            .update(payload)
            .eq('id', homilyId!)
            .select()
            .limit(1);
          if (error) {
            console.error('❌ Erreur Supabase détaillée (update homily):', {
              message: error.message,
              code: (error as { code?: string }).code,
              details: (error as { details?: string }).details,
              hint: (error as { hint?: string }).hint,
              data: error,
              sentPayload: payload,
            });
            throw error;
          }
          console.log('ℹ️ Résultat update homily:', data);
          // If update returns no rows, nothing was actually updated (RLS/no match).
          if (Array.isArray(data) && data.length === 0) {
            throw new Error(
              "Aucune homelie n'a ete modifiee. Verifiez vos permissions (RLS) ou l'existence de l'enregistrement.",
            );
          }
          return Array.isArray(data) ? (data[0] ?? null) : data;
        }
        const { data, error } = await supabase
          .from('homilies')
          .insert([{ ...payload, created_at: new Date().toISOString() }])
          .select()
          .limit(1);
        if (error) {
          console.error('❌ Erreur Supabase détaillée (insert homily):', {
            message: error.message,
            code: (error as { code?: string }).code,
            details: (error as { details?: string }).details,
            hint: (error as { hint?: string }).hint,
            data: error,
            sentPayload: payload,
          });
          throw error;
        }
        console.log('✅ Homélie sauvegardée avec succès:', data);
        return Array.isArray(data) ? (data[0] ?? null) : data;
      };
      let data: unknown = null;
      let usedSchemaFallback = false;
      // Retry several times by removing unknown columns progressively.
      for (let attempt = 0; attempt < 6; attempt += 1) {
        try {
          data = await executeSaveWithFallback();
          break;
        } catch (error: unknown) {
          const msg =
            error instanceof Error
              ? error.message
              : String((error as { message?: string } | null)?.message || '');
          const missingColumnMatch = msg.match(/Could not find the '([^']+)' column/i);
          if (!missingColumnMatch) throw error;
          const missing = missingColumnMatch[1];
          usedSchemaFallback = true;
          if (missing === 'category_id') setSupportsCategoryId(false);
          if (missing === 'category_label') setSupportsCategoryLabel(false);
          if (missing === 'officiant_id') setSupportsOfficiantId(false);
          if (missing === 'video_storage_path') setSupportsVideoStoragePath(false);
          if (missing === 'thumbnail_storage_path') setSupportsThumbnailStoragePath(false);
          delete payload[missing];
        }
      }

      if (!data) {
        throw new Error('Echec de sauvegarde apres adaptation automatique du schema.');
      }

      if (usedSchemaFallback) {
        toast({
          title: 'Succes',
          description: 'Homelie enregistree (schema ancien detecte, migration recommandee).',
        });
      } else if (isEditing) {
        toast({ title: 'Succes', description: 'Homelie mise a jour.' });
      } else {
        toast({ title: 'Succes', description: 'Homelie ajoutee.' });
      }
      onSaved?.((data as HomilyData) || null);

      onClose();
    } catch (err) {
      console.error('❌ Erreur complète (save homily):', err);
      const message = err instanceof Error ? err.message : 'Impossible de sauvegarder cette homelie.';
      setSubmitError(message);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DraggableModal
      open={open}
      onClose={onClose}
      initialY={120}
      draggableOnMobile
      center
      maxWidthClass="max-w-3xl"
      title={isEditing ? "Modifier l'homelie" : 'Nouvelle homelie'}
    >
      <form onSubmit={handleSave} className="p-4 md:p-6 space-y-6 max-h-[85vh] overflow-y-auto">
        {submitError ? (
          <div className="text-sm rounded-lg border border-destructive/30 bg-destructive/10 text-destructive px-3 py-2">
            {submitError}
          </div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Titre *</label>
            <Input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium">Categorie</label>
            <Select
              value={form.category_id}
              onValueChange={(value) =>
                setForm((s) => ({
                  ...s,
                  category_id: value,
                  category_label: categories.find((c) => c.id === value)?.name || '',
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir une categorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Officiant</label>
            <Select value={form.officiant_id} onValueChange={(value) => setForm((s) => ({ ...s, officiant_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un officiant" />
              </SelectTrigger>
              <SelectContent>
                {officiants.length > 0 ? (
                  officiants.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__none" disabled>
                    Aucun officiant actif
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <Input
              className="mt-2"
              placeholder="Ou saisir le nom de l'officiant"
              value={form.priest_name}
              onChange={(e) => setForm((s) => ({ ...s, priest_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Date de predication *</label>
            <Input type="date" value={form.homily_date} onChange={(e) => setForm((s) => ({ ...s, homily_date: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Contenu *</label>
          <Textarea
            className="min-h-[130px]"
            placeholder="Saisissez un resume spirituel de l'homelie..."
            value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video (URL ou upload)
            </label>
            <Input
              placeholder="https://youtube.com/... ou https://....mp4"
              value={form.video_url}
              onChange={(e) => setForm((s) => ({ ...s, video_url: e.target.value }))}
            />
            <input
              ref={videoFileInputRef}
              id="homily-video-file"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && void handleVideoUpload(e.target.files[0])}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={videoUploading}
                onClick={(ev) => {
                  ev.preventDefault();
                  videoFileInputRef.current?.click();
                }}
              >
              {videoUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Televerser une video
              </Button>
              <label htmlFor="homily-video-file" className="text-xs text-muted-foreground underline cursor-pointer">
                Choisir un fichier
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Taille recommandee: 1920x1080 (16:9)</p>
            {form.video_url && (
              <div className="rounded-lg border overflow-hidden bg-muted/30">
                {getYouTubeEmbedUrl(form.video_url) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(form.video_url) || ''}
                    title="Apercu video YouTube"
                    className="w-full h-48"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : form.video_url.includes('vimeo.com') ? (
                  <div className="p-3 text-xs text-muted-foreground">Apercu Vimeo indisponible ici, lien bien enregistre.</div>
                ) : (
                  <video src={form.video_url} controls className="w-full max-h-48 object-cover" />
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Vignette (URL ou upload)
            </label>
            <Input
              placeholder="https://.../thumbnail.jpg"
              value={form.image_url}
              onChange={(e) => setForm((s) => ({ ...s, image_url: e.target.value }))}
            />
            <input
              ref={thumbnailFileInputRef}
              id="homily-thumbnail-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && void handleThumbnailUpload(e.target.files[0])}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={thumbUploading}
                onClick={(ev) => {
                  ev.preventDefault();
                  thumbnailFileInputRef.current?.click();
                }}
              >
              {thumbUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Televerser une vignette
              </Button>
              <label htmlFor="homily-thumbnail-file" className="text-xs text-muted-foreground underline cursor-pointer">
                Choisir une image
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Taille recommandee: 1920x600 minimum</p>
            {form.image_url && (
              <img src={form.image_url} alt="Apercu vignette" className="w-[120px] h-[68px] object-cover rounded-lg border" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Duree (minutes)</label>
            <Input
              type="number"
              min={0}
              placeholder="Optionnel"
              value={form.duration_minutes}
              onChange={(e) => setForm((s) => ({ ...s, duration_minutes: e.target.value }))}
            />
          </div>
          <div />
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading || videoUploading || thumbUploading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {loading ? 'Enregistrement...' : isEditing ? 'Mettre a jour' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </DraggableModal>
  );
};

export default HomilyModal;
