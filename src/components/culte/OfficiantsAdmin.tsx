import React, { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import DraggableModal from '@/components/DraggableModal';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Upload } from 'lucide-react';
import type { OfficiantRow } from '@/types/culte';
import { getOfficiantTitleDescription, useOfficiantTitles } from '@/hooks/useOfficiantTitles';
import { useOfficiants } from '@/hooks/useOfficiants';
import {
  deleteOfficiant,
  fetchDailyOfficiant,
  setDailyOfficiant,
  upsertOfficiant,
} from '@/lib/supabase/culteApi';
import { DailyOfficiantCard } from '@/components/admin/DailyOfficiantCard';
import { DailyOfficiantHistory } from '@/components/admin/DailyOfficiantHistory';
import { OfficiantsTable } from '@/components/admin/OfficiantsTable';
import { uploadFile } from '@/lib/supabase/storage';

type OfficiantsAdminProps = {
  paroisseId: string;
  paroisseNom?: string;
};

export default function OfficiantsAdmin({ paroisseId, paroisseNom = '' }: OfficiantsAdminProps) {
  const { toast } = useToast();
  const { ensureTitles, titles: canonicalTitles } = useOfficiantTitles(paroisseId);
  const { officiants, loading: listLoading, refetch: refetchOfficiants } = useOfficiants(paroisseId);

  const [actionLoading, setActionLoading] = useState(false);
  const [resolvedDaily, setResolvedDaily] = useState<OfficiantRow | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [dailyOfficiantId, setDailyOfficiantId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    id: '' as string,
    name: '',
    title: '',
    description: '',
    bio: '',
    photo_url: '',
    is_active: true,
    sort_order: 0,
  });
  const [photoUploading, setPhotoUploading] = useState(false);
  const [historyBump, setHistoryBump] = useState(0);

  const bumpHistory = () => setHistoryBump((n) => n + 1);

  const resetForm = () => {
    setForm({
      id: '',
      name: '',
      title: '',
      description: '',
      bio: '',
      photo_url: '',
      is_active: true,
      sort_order: 0,
    });
  };

  useEffect(() => {
    void ensureTitles();
  }, [ensureTitles]);

  const refreshDaily = async () => {
    const day = await fetchDailyOfficiant(paroisseId, selectedDate);
    setResolvedDaily(day.officiant ?? null);
    setDailyOfficiantId(day.officiant?.id ?? null);
  };

  useEffect(() => {
    void refreshDaily();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paroisseId, selectedDate]);

  const titleOptions = useMemo(() => {
    const existingTitles = officiants
      .map((o) => o.title)
      .filter((t): t is string => Boolean(t && t.trim()))
      .map((t) => t.trim());
    const extraCurrent = form.title?.trim() ? [form.title.trim()] : [];
    return Array.from(new Set([...canonicalTitles, ...existingTitles, ...extraCurrent]));
  }, [canonicalTitles, officiants, form.title]);

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (o: OfficiantRow) => {
    setForm({
      id: o.id,
      name: o.name,
      title: o.title ?? '',
      description: o.description ?? '',
      bio: o.bio ?? '',
      photo_url: o.photo_url ?? '',
      is_active: o.is_active,
      sort_order: o.sort_order ?? o.display_order ?? 0,
    });
    setDialogOpen(true);
  };

  const handleSaveOfficiant = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Nom requis', description: 'Veuillez saisir un nom d’officiant.', variant: 'destructive' });
      return;
    }
    setActionLoading(true);
    try {
      await upsertOfficiant({
        paroisse_id: paroisseId,
        id: form.id || undefined,
        name: form.name.trim(),
        title: form.title.trim() || null,
        description: form.description.trim() || null,
        bio: form.bio.trim() || null,
        photo_url: form.photo_url.trim() || null,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
      });
      toast({ title: 'Officiant enregistré' });
      setDialogOpen(false);
      resetForm();
      await refetchOfficiants();
      await refreshDaily();
      bumpHistory();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleHistoryPick = (date: string, officiantId: string | null) => {
    setSelectedDate(date);
    setDailyOfficiantId(officiantId);
  };

  const handleDelete = async (o: OfficiantRow) => {
    if (!confirm(`Supprimer l’officiant « ${o.name} » ?`)) return;
    setActionLoading(true);
    try {
      await deleteOfficiant(o.id);
      toast({ title: 'Officiant supprimé' });
      await refetchOfficiants();
      await refreshDaily();
      bumpHistory();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetDaily = async () => {
    setActionLoading(true);
    try {
      await setDailyOfficiant(paroisseId, selectedDate, dailyOfficiantId);
      toast({ title: 'Officiant du jour mis à jour' });
      await refreshDaily();
      bumpHistory();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const activeOrdered = useMemo(
    () =>
      officiants
        .filter((o) => o.is_active)
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name)),
    [officiants],
  );

  const handleRotateNext = () => {
    if (activeOrdered.length === 0) {
      toast({ title: 'Aucun officiant actif', description: 'Ajoutez ou réactivez un officiant.', variant: 'destructive' });
      return;
    }
    const currentId = dailyOfficiantId ?? resolvedDaily?.id ?? null;
    const idx = currentId ? activeOrdered.findIndex((o) => o.id === currentId) : -1;
    const next = activeOrdered[(idx + 1) % activeOrdered.length];
    if (next) setDailyOfficiantId(next.id);
  };

  const handlePhotoFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoUploading(true);
    try {
      const res = await uploadFile(file, `officiants/${Date.now()}_${file.name.replace(/\s+/g, '_')}`);
      if (res?.publicUrl) {
        setForm((p) => ({ ...p, photo_url: res.publicUrl! }));
        toast({ title: 'Photo téléversée' });
      } else {
        toast({ title: 'Erreur', description: 'Échec du téléversement', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible d’uploader la photo', variant: 'destructive' });
    } finally {
      setPhotoUploading(false);
    }
  };

  const busy = listLoading || actionLoading;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7">
          <DailyOfficiantCard
            paroisseNom={paroisseNom}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            resolvedDaily={resolvedDaily}
            draftOfficiantId={dailyOfficiantId}
            onDraftOfficiantIdChange={setDailyOfficiantId}
            officiants={officiants}
            onApply={() => void handleSetDaily()}
            onRotateNext={handleRotateNext}
            loading={busy}
          />
        </div>
        <div className="lg:col-span-5">
          <DailyOfficiantHistory
            paroisseId={paroisseId}
            days={14}
            refreshKey={historyBump}
            selectedDate={selectedDate}
            onSelectEntry={handleHistoryPick}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Tous les officiants</h2>
        <Button type="button" onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un officiant
        </Button>
      </div>

      <OfficiantsTable
        paroisseNom={paroisseNom}
        officiants={officiants}
        titleOptions={titleOptions}
        loading={listLoading}
        onEdit={openEdit}
        onDelete={(row) => void handleDelete(row)}
      />

      <DraggableModal
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          resetForm();
        }}
        title={form.id ? 'Modifier un officiant' : 'Nouvel officiant'}
        center
        initialY={48}
        maxWidthClass="max-w-lg"
        className="max-h-[90vh]"
        bodyClassName="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-3.5rem)]"
      >
        <p id="off-dialog-desc" className="text-sm text-muted-foreground mb-4">
          Renseignez les informations affichées sur le site et dans les formulaires de demande.
        </p>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Nom complet *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nom"
              />
            </div>
            <div className="space-y-2">
              <Label>Titre ecclésiastique</Label>
              <Select
                value={form.title || '__none'}
                onValueChange={(v) => {
                  const nextTitle = v === '__none' ? '' : v;
                  setForm((p) => {
                    const prevSuggestion = p.title ? getOfficiantTitleDescription(p.title) : null;
                    const nextSuggestion = nextTitle ? getOfficiantTitleDescription(nextTitle) : null;
                    const shouldAutofill =
                      !p.description.trim() || (prevSuggestion && p.description.trim() === prevSuggestion.trim());
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
                <SelectContent className="max-h-72">
                  <SelectItem value="__none">— Aucun —</SelectItem>
                  {titleOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description (suggestion selon le titre, modifiable)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Biographie courte"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {form.photo_url ? (
                  <img
                    src={form.photo_url}
                    alt=""
                    className="h-20 w-20 rounded-md border object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                    Aperçu
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-2">
                  <Input
                    value={form.photo_url}
                    onChange={(e) => setForm((p) => ({ ...p, photo_url: e.target.value }))}
                    placeholder="URL de la photo (optionnel)"
                  />
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      id="officiant-photo-upload"
                      onChange={(e) => void handlePhotoFile(e)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={photoUploading}
                      onClick={() => document.getElementById('officiant-photo-upload')?.click()}
                    >
                      {photoUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Téléverser une image
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="off-active-switch">Statut</Label>
                <p className="text-xs text-muted-foreground">Inactif : masqué des listes publiques.</p>
              </div>
              <Switch
                id="off-active-switch"
                checked={form.is_active}
                onCheckedChange={(c) => setForm((p) => ({ ...p, is_active: c }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Ordre d’affichage</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
              disabled={actionLoading}
            >
              Annuler
            </Button>
            <Button type="button" onClick={() => void handleSaveOfficiant()} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </div>
      </DraggableModal>
    </div>
  );
}
