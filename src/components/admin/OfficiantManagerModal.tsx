import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import DraggableModal from '@/components/DraggableModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/lib/supabase/storage';
import { Loader2, Plus, Trash2, Edit2, Save, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { getOfficiantTitleDescription, useOfficiantTitles } from '@/hooks/useOfficiantTitles';
import { listAllOfficiantsAdmin } from '@/lib/supabase/culteApi';

interface OfficiantManagerModalProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type Officiant = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  grade?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean | null;
  paroisse_id?: string | null;
};

type OfficiantForm = {
  full_name: string;
  title: string;
  description: string;
  bio: string;
  photo_url: string;
  phone: string;
  email: string;
  is_active: boolean;
};

const emptyForm: OfficiantForm = {
  full_name: '',
  title: '',
  description: '',
  bio: '',
  photo_url: '',
  phone: '',
  email: '',
  is_active: true,
};

export function OfficiantManagerModal({ open, onClose, onComplete }: OfficiantManagerModalProps) {
  const { profile, refreshProfile } = useAuth();
  const paroisseId = profile?.paroisse_id ?? null;
  const { ensureTitles, titles: canonicalTitles } = useOfficiantTitles(paroisseId);
  const [isLoading, setIsLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [officiants, setOfficiants] = useState<Officiant[]>([]);
  const [selectedOfficiant, setSelectedOfficiant] = useState<Officiant | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<OfficiantForm>(emptyForm);

  const selectedName = useMemo(
    () => selectedOfficiant?.full_name || selectedOfficiant?.name || 'Sans nom',
    [selectedOfficiant],
  );

  const loadOfficiants = async () => {
    if (!paroisseId) {
      setOfficiants([]);
      return;
    }
    const rows = await listAllOfficiantsAdmin(paroisseId, { activeOnly: false, excludeTitleStubs: true });
    setOfficiants(rows as Officiant[]);
  };

  useEffect(() => {
    if (!open) return;
    void ensureTitles();
    void loadOfficiants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, paroisseId]);

  const titleOptions = useMemo(() => {
    const existingTitles = officiants
      .map((o) => o.title)
      .filter((t): t is string => Boolean(t && t.trim()))
      .map((t) => t.trim());
    const extraCurrent = formData.title?.trim() ? [formData.title.trim()] : [];
    return Array.from(new Set([...canonicalTitles, ...existingTitles, ...extraCurrent]));
  }, [canonicalTitles, officiants, formData.title]);

  const handleSave = async () => {
    if (!formData.full_name?.trim()) {
      toast.error('Le nom complet est requis');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: formData.full_name,
        title: formData.title || null,
        description: formData.description || null,
        bio: formData.bio || null,
        photo_url: formData.photo_url.trim() || null,
        paroisse_id: paroisseId,
        phone: formData.phone || null,
        email: formData.email || null,
        is_active: Boolean(formData.is_active),
      };
      if (isEditing && selectedOfficiant?.id) {
        const { error } = await supabase
          .from('officiants')
          .update(payload as never)
          .eq('id', selectedOfficiant.id);
        if (error) throw error;
        toast.success('Officiant mis a jour');
      } else {
        const { error } = await supabase.from('officiants').insert(payload as never);
        if (error) throw error;
        toast.success('Officiant ajoute');
      }
      await loadOfficiants();
      setIsEditing(false);
      setSelectedOfficiant(null);
      setFormData(emptyForm);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoUploading(true);
    try {
      const res = await uploadFile(file, `officiants/${Date.now()}_${file.name.replace(/\s+/g, '_')}`);
      if (res?.publicUrl) {
        setFormData((p) => ({ ...p, photo_url: res.publicUrl! }));
        toast.success('Photo téléversée');
      } else {
        toast.error('Échec du téléversement');
      }
    } catch {
      toast.error("Impossible d'uploader la photo");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleDelete = async (officiant: Officiant) => {
    const label = officiant.full_name || officiant.name || 'cet officiant';
    if (!window.confirm(`Supprimer "${label}" ?`)) return;
    await supabase.from('officiants').delete().eq('id', officiant.id);
    await loadOfficiants();
    if (selectedOfficiant?.id === officiant.id) {
      setSelectedOfficiant(null);
      setIsEditing(false);
      setFormData(emptyForm);
    }
  };

  const markCompleted = async () => {
    await supabase
      .from('profiles')
      .update({ has_seen_officiant_manager: true } as never)
      .eq('id', profile?.id);
    await refreshProfile();
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await markCompleted();
      toast.success('Configuration des officiants terminee');
      onComplete?.();
      onClose();
    } catch {
      toast.error('Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await markCompleted();
    } catch {
      // no-op
    } finally {
      onClose();
    }
  };

  return (
    <DraggableModal
      open={open}
      onClose={() => void handleSkip()}
      title="Gestion des officiants"
      center
      initialY={40}
      maxWidthClass="max-w-6xl"
      className="h-[85vh] max-h-[85vh]"
      bodyClassName="p-0 overflow-hidden"
    >
      <div className="flex h-full">
        <div className="w-80 border-r p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Officiants</h3>
            <Button
              size="sm"
              onClick={() => {
                setSelectedOfficiant(null);
                setIsEditing(true);
                setFormData(emptyForm);
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </div>
          <div className="space-y-2">
            {officiants.map((o) => (
              <div
                key={o.id}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedOfficiant?.id === o.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
                onClick={() => {
                  setSelectedOfficiant(o);
                  setIsEditing(false);
                }}
              >
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{o.full_name || o.name || 'Sans nom'}</div>
                    <div className="text-xs opacity-75 truncate">{o.title || '—'}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOfficiant(o);
                        setFormData({
                          full_name: o.full_name || o.name || '',
                          title: o.title || '',
                          description: o.description || '',
                          bio: o.bio || o.grade || '',
                          photo_url: o.photo_url || '',
                          phone: o.phone || '',
                          email: o.email || '',
                          is_active: o.is_active ?? true,
                        });
                        setIsEditing(true);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(o);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                {o.is_active && <Badge variant="outline" className="mt-1 text-xs">Actif</Badge>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {isEditing ? (
            <div className="space-y-6">
              <div className="flex justify-between">
                <h3 className="text-lg font-semibold">{selectedOfficiant ? 'Modifier' : 'Nouvel'} officiant</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-1" />Annuler
                  </Button>
                  <Button size="sm" onClick={() => void handleSave()} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-1" />Enregistrer
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom *</Label>
                  <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                </div>
                <div>
                  <Label>Titre</Label>
                  <Select
                    value={formData.title || '__none'}
                    onValueChange={(v) => {
                      const nextTitle = v === '__none' ? '' : v;
                      setFormData((p) => {
                        const prevSuggestion = p.title ? getOfficiantTitleDescription(p.title) : null;
                        const nextSuggestion = nextTitle ? getOfficiantTitleDescription(nextTitle) : null;
                        const shouldAutofill =
                          !p.description.trim() ||
                          (prevSuggestion && p.description.trim() === prevSuggestion.trim());
                        return {
                          ...p,
                          title: nextTitle,
                          description: shouldAutofill ? (nextSuggestion ?? p.description) : p.description,
                        };
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un titre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— Aucun —</SelectItem>
                      {titleOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label>Description (suggestion modifiable)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description (pré-remplie automatiquement selon le titre)"
                    rows={3}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Bio (libre)</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Bio libre (ne remplace pas la description)"
                    rows={4}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Photo</Label>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {formData.photo_url ? (
                      <img src={formData.photo_url} alt="" className="h-20 w-20 rounded-md border object-cover" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-2">
                      <Input
                        value={formData.photo_url}
                        onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                        placeholder="URL de la photo (optionnel)"
                      />
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          id="modal-officiant-photo"
                          onChange={(ev) => void handlePhotoFile(ev)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={photoUploading}
                          onClick={() => document.getElementById('modal-officiant-photo')?.click()}
                        >
                          {photoUploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          Téléverser
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="modal-off-active">Visible (actif)</Label>
                    <p className="text-xs text-muted-foreground">Inactif : masqué des sélections publiques.</p>
                  </div>
                  <Switch
                    id="modal-off-active"
                    checked={formData.is_active}
                    onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
                  />
                </div>
              </div>
            </div>
          ) : selectedOfficiant ? (
            <div className="space-y-4">
              {selectedOfficiant.photo_url ? (
                <img
                  src={selectedOfficiant.photo_url}
                  alt=""
                  className="h-24 w-24 rounded-lg border object-cover"
                />
              ) : null}
              <h2 className="text-2xl font-bold">{selectedName}</h2>
              <p className="text-muted-foreground">{selectedOfficiant.title || '—'}</p>
              {selectedOfficiant.description ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedOfficiant.description}</p>
              ) : null}
              <div className="text-sm space-y-1">
                <p>Telephone: {selectedOfficiant.phone || '—'}</p>
                <p>Email: {selectedOfficiant.email || '—'}</p>
              </div>
              <Button size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-1" />Modifier
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Selectionnez un officiant ou creez-en un</p>
            </div>
          )}
        </div>
      </div>
      <div className="border-t p-4 flex justify-end">
        <Button onClick={() => void handleComplete()} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Terminer la configuration
        </Button>
      </div>
    </DraggableModal>
  );
}
