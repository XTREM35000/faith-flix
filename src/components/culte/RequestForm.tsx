import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { fetchDailyOfficiant, insertRequest } from '@/lib/supabase/culteApi';
import type {
  BaptismChild,
  BaptismParent,
  CulteRequestType,
  OfficiantRow,
  RequestPriority,
  WeddingParticipant,
} from '@/types/culte';
import { Loader2 } from 'lucide-react';

const PRIORITIES: { value: RequestPriority; label: string }[] = [
  { value: 'very_high', label: 'Très haut' },
  { value: 'high', label: 'Haut' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Bas' },
  { value: 'very_low', label: 'Très bas' },
];

export interface RequestFormProps {
  type: CulteRequestType;
  paroisseId: string | null;
  officiants: OfficiantRow[];
  defaultOfficiant: OfficiantRow | null;
  title: string;
  description: string;
}

export default function RequestForm({
  type,
  paroisseId,
  officiants,
  defaultOfficiant,
  title,
  description,
}: RequestFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [isAnonymous, setIsAnonymous] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  const [location, setLocation] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredOfficiantId, setPreferredOfficiantId] = useState<string>('');
  const [priority, setPriority] = useState<RequestPriority>('normal');
  const [projectDescription, setProjectDescription] = useState('');

  const [durationMinutes, setDurationMinutes] = useState<number>(30);

  // Officiant d'office calculé selon la date sélectionnée (et non seulement “aujourd’hui”).
  const [dailyOfficiant, setDailyOfficiant] = useState<OfficiantRow | null>(defaultOfficiant);

  // Synchronise l'officiant initial depuis les props (chargement page/admin).
  React.useEffect(() => {
    setDailyOfficiant(defaultOfficiant);
  }, [defaultOfficiant?.id]);

  const [participants, setParticipants] = useState<WeddingParticipant[]>([
    { firstName: '', lastName: '', role: '', category: 'adult' },
  ]);

  const [child, setChild] = useState<BaptismChild>({
    firstName: '',
    lastName: '',
    birthDate: '',
    age: '',
  });
  const [parents, setParents] = useState<BaptismParent[]>([
    { firstName: '', lastName: '', contact: '' },
  ]);
  const [godparents, setGodparents] = useState('');

  const steps = useMemo(() => {
    const base = ['Identité', 'Lieu & planning', 'Détails'];
    if (type === 'confession') return ['Identité', 'Créneau & durée', 'Confirmation'];
    return [...base, 'Envoi'];
  }, [type]);

  React.useEffect(() => {
    if (!paroisseId) return;
    if (!preferredDate) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetchDailyOfficiant(paroisseId, preferredDate);
        if (!cancelled) setDailyOfficiant(res.officiant);
      } catch {
        // Best-effort : si ça échoue, on conserve l'officiant actuel (pas bloquant).
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paroisseId, preferredDate]);

  const canProceedStep0 = () => {
    if (isAnonymous) return true;
    return userName.trim().length >= 2 && userEmail.includes('@');
  };

  const handleSubmit = async () => {
    if (!paroisseId) {
      toast({
        title: 'Paroisse requise',
        description: 'Sélectionnez une paroisse (menu ou sélecteur) avant d’envoyer.',
        variant: 'destructive',
      });
      return;
    }
    if (!preferredDate) {
      toast({ title: 'Date requise', description: 'Indiquez une date et une heure souhaitées.', variant: 'destructive' });
      return;
    }
    if (!isAnonymous && !userEmail.includes('@')) {
      toast({ title: 'Email requis', description: 'Une adresse email valide est nécessaire si la demande est publique.', variant: 'destructive' });
      return;
    }

    let metadata: Record<string, unknown> = {};
    if (type === 'wedding') {
      metadata = {
        participants: participants.filter((p) => p.firstName || p.lastName),
        projectDescription: projectDescription.trim(),
      };
    } else if (type === 'baptism') {
      metadata = {
        child,
        parents,
        godparents: godparents.trim() || null,
      };
    }

    setLoading(true);
    try {
      await insertRequest({
        paroisse_id: paroisseId,
        type,
        is_anonymous: isAnonymous,
        user_id: user?.id ?? null,
        user_name: isAnonymous ? null : userName.trim() || null,
        user_email: isAnonymous ? null : userEmail.trim() || null,
        user_phone: isAnonymous ? null : userPhone.trim() || null,
        location: location.trim() || null,
        preferred_date: new Date(preferredDate).toISOString(),
        preferred_officiant_id: preferredOfficiantId || null,
        default_officiant_id: dailyOfficiant?.id ?? null,
        duration_minutes: type === 'confession' ? durationMinutes : null,
        description: projectDescription.trim() || null,
        priority,
        metadata,
      });
      toast({
        title: 'Demande envoyée',
        description: 'Votre demande a été transmise à l’équipe paroissiale.',
      });
      setStep(0);
      setLocation('');
      setPreferredDate('');
      setProjectDescription('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-sm mt-1">{description}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {steps.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              i === step ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-border'
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Confidentialité</CardTitle>
            <CardDescription>Choisissez si votre demande est anonyme ou associée à vos coordonnées.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={isAnonymous ? 'anon' : 'public'}
              onValueChange={(v) => setIsAnonymous(v === 'anon')}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="anon" id="anon" />
                <Label htmlFor="anon">Anonyme</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="public" id="pub" />
                <Label htmlFor="pub">Public (nom & contact visibles pour le suivi)</Label>
              </div>
            </RadioGroup>
            {!isAnonymous && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Nom complet</Label>
                  <Input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Nom et prénom" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Téléphone (optionnel)</Label>
                  <Input value={userPhone} onChange={(e) => setUserPhone(e.target.value)} placeholder="+225…" />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={next} disabled={!canProceedStep0()}>
                Suivant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{type === 'confession' ? 'Créneau' : 'Lieu & planning'}</CardTitle>
            <CardDescription>
              {type === 'confession'
                ? 'Indiquez le créneau souhaité et la durée estimée.'
                : 'Lieu souhaité, date et officiants.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {type !== 'confession' && (
              <div>
                <Label>Lieu souhaité</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Église, salle…" />
              </div>
            )}
            <div>
              <Label>Date et heure souhaitées</Label>
              <Input
                type="datetime-local"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
            </div>
            {type === 'confession' && (
              <div>
                <Label>Durée estimée</Label>
                <Select
                  value={String(durationMinutes)}
                  onValueChange={(v) => setDurationMinutes(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[15, 30, 45, 60].map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {m} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Officiant choisi</Label>
                <Select value={preferredOfficiantId || '__none'} onValueChange={(v) => setPreferredOfficiantId(v === '__none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— Aucune préférence —</SelectItem>
                    {officiants.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                        {o.title ? ` — ${o.title}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Officiant d’office (jour)</Label>
                <Input
                  readOnly
                  className="bg-muted"
                  value={
                    dailyOfficiant
                      ? `${dailyOfficiant.name}${dailyOfficiant.title ? ` (${dailyOfficiant.title})` : ''}`
                      : 'Non défini par l’administration'
                  }
                />
              </div>
            </div>
            <div>
              <Label>Priorité</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as RequestPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={prev}>
                Retour
              </Button>
              <Button type="button" onClick={next} disabled={!preferredDate}>
                Suivant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && type === 'confession' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Confirmation</CardTitle>
            <CardDescription>Précisez éventuellement le contexte (facultatif, confidentiel).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Description (optionnel)</Label>
              <Textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={4}
                placeholder="Informations utiles pour l’accueil (restera confidentiel selon les règles pastorales)."
              />
            </div>
            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={prev}>
                Retour
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Envoyer la demande'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && type === 'wedding' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Participants & projet</CardTitle>
            <CardDescription>Indiquez les fiancés et participants principaux.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {participants.map((p, idx) => (
              <div key={idx} className="grid gap-2 sm:grid-cols-2 border rounded-lg p-3">
                <Input
                  placeholder="Prénom"
                  value={p.firstName}
                  onChange={(e) => {
                    const n = [...participants];
                    n[idx].firstName = e.target.value;
                    setParticipants(n);
                  }}
                />
                <Input
                  placeholder="Nom"
                  value={p.lastName}
                  onChange={(e) => {
                    const n = [...participants];
                    n[idx].lastName = e.target.value;
                    setParticipants(n);
                  }}
                />
                <Input
                  placeholder="Fonction / rôle (ex. fiancé)"
                  value={p.role}
                  onChange={(e) => {
                    const n = [...participants];
                    n[idx].role = e.target.value;
                    setParticipants(n);
                  }}
                />
                <Select
                  value={p.category}
                  onValueChange={(v) => {
                    const n = [...participants];
                    n[idx].category = v as WeddingParticipant['category'];
                    setParticipants(n);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adult">Adulte</SelectItem>
                    <SelectItem value="young">Jeune</SelectItem>
                    <SelectItem value="child">Enfant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setParticipants([...participants, { firstName: '', lastName: '', role: '', category: 'adult' }])
              }
            >
              Ajouter un participant
            </Button>
            <div>
              <Label>Description du projet</Label>
              <Textarea value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} rows={4} />
            </div>
            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={prev}>
                Retour
              </Button>
              <Button type="button" onClick={next}>
                Suivant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && type === 'baptism' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Enfant & famille</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder="Prénom enfant" value={child.firstName} onChange={(e) => setChild({ ...child, firstName: e.target.value })} />
              <Input placeholder="Nom enfant" value={child.lastName} onChange={(e) => setChild({ ...child, lastName: e.target.value })} />
              <Input type="date" value={child.birthDate} onChange={(e) => setChild({ ...child, birthDate: e.target.value })} />
              <Input placeholder="Âge" value={child.age} onChange={(e) => setChild({ ...child, age: e.target.value })} />
            </div>
            <p className="text-sm font-medium">Parents</p>
            {parents.map((par, idx) => (
              <div key={idx} className="grid gap-2 sm:grid-cols-3 border rounded-lg p-3">
                <Input
                  placeholder="Prénom"
                  value={par.firstName}
                  onChange={(e) => {
                    const n = [...parents];
                    n[idx].firstName = e.target.value;
                    setParents(n);
                  }}
                />
                <Input
                  placeholder="Nom"
                  value={par.lastName}
                  onChange={(e) => {
                    const n = [...parents];
                    n[idx].lastName = e.target.value;
                    setParents(n);
                  }}
                />
                <Input
                  placeholder="Contact"
                  value={par.contact}
                  onChange={(e) => {
                    const n = [...parents];
                    n[idx].contact = e.target.value;
                    setParents(n);
                  }}
                />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setParents([...parents, { firstName: '', lastName: '', contact: '' }])}>
              Ajouter un parent / tuteur
            </Button>
            <div>
              <Label>Parrains / marraines (optionnel)</Label>
              <Textarea value={godparents} onChange={(e) => setGodparents(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Notes complémentaires</Label>
              <Textarea value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} rows={3} />
            </div>
            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={prev}>
                Retour
              </Button>
              <Button type="button" onClick={next}>
                Suivant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && type !== 'confession' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Envoi</CardTitle>
            <CardDescription>Vérifiez les informations puis transmettez votre demande.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={prev}>
                Retour
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Envoyer la demande'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
