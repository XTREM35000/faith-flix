import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OfficiantRow } from '@/types/culte';
import { Loader2, RotateCw, UserCircle2 } from 'lucide-react';

export interface DailyOfficiantCardProps {
  paroisseNom: string;
  selectedDate: string;
  onDateChange: (isoDate: string) => void;
  /** Officiant enregistré pour cette date (après apply / refresh). */
  resolvedDaily: OfficiantRow | null;
  /** Valeur courante du sélecteur (peut différer avant « Appliquer »). */
  draftOfficiantId: string | null;
  onDraftOfficiantIdChange: (id: string | null) => void;
  officiants: OfficiantRow[];
  onApply: () => void;
  /** Passe à l’officiant actif suivant dans la liste (rotation manuelle). */
  onRotateNext: () => void;
  loading?: boolean;
}

function shortBio(o: OfficiantRow | null, maxLen = 160): string {
  if (!o) return '';
  const raw = (o.bio || o.description || '').trim();
  if (raw.length <= maxLen) return raw;
  return `${raw.slice(0, maxLen).trim()}…`;
}

export function DailyOfficiantCard({
  paroisseNom,
  selectedDate,
  onDateChange,
  resolvedDaily,
  draftOfficiantId,
  onDraftOfficiantIdChange,
  officiants,
  onApply,
  onRotateNext,
  loading,
}: DailyOfficiantCardProps) {
  const fromDraft =
    draftOfficiantId != null
      ? (officiants.find((x) => x.id === draftOfficiantId) ?? null)
      : null;
  const display = resolvedDaily ?? fromDraft;

  const initials = display?.name
    ? display.name
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-muted/30">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold tracking-tight">Officiant du jour</CardTitle>
            <CardDescription>
              Mis en avant pour les formulaires et la date choisie — paroisse :{' '}
              <span className="font-medium text-foreground">{paroisseNom || '—'}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-stretch">
          <div className="flex shrink-0 justify-center md:justify-start">
            <Avatar className="h-28 w-28 border-2 border-primary/30 shadow-md">
              {display?.photo_url ? (
                <AvatarImage src={display.photo_url} alt="" className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-muted text-2xl">
                {display ? initials : <UserCircle2 className="h-14 w-14 text-muted-foreground" />}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            {display ? (
              <>
                <h3 className="text-2xl font-bold leading-tight">{display.name}</h3>
                <p className="text-sm font-medium text-primary">{display.title || '—'}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{shortBio(display) || '—'}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun officiant du jour pour cette date. Choisissez un officiant ci-dessous puis cliquez sur
                « Enregistrer ».
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <div className="space-y-2 lg:col-span-3">
            <Label htmlFor="daily-date">Date</Label>
            <Input id="daily-date" type="date" value={selectedDate} onChange={(e) => onDateChange(e.target.value)} />
          </div>
          <div className="space-y-2 lg:col-span-5">
            <Label>Officiant</Label>
            <Select
              value={draftOfficiantId ?? '__none'}
              onValueChange={(v) => onDraftOfficiantIdChange(v === '__none' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un officiant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— Aucun —</SelectItem>
                {officiants.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                    {o.title ? ` (${o.title})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 lg:col-span-4 lg:justify-end">
            <Button type="button" variant="outline" onClick={onRotateNext} disabled={loading}>
              <RotateCw className="mr-2 h-4 w-4" />
              Suivant
            </Button>
            <Button type="button" onClick={onApply} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enregistrer le jour
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
