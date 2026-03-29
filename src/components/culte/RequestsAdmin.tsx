import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { CulteRequestType, OfficiantRow, RequestPriority, RequestRow, RequestStatus } from '@/types/culte';
import {
  listAllOfficiantsAdmin,
  listRequestsAdmin,
  updateRequestAdmin,
} from '@/lib/supabase/culteApi';
import { Loader2, SlidersHorizontal } from 'lucide-react';

const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Refusée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const PRIORITY_LABEL: Record<RequestPriority, string> = {
  very_high: 'Très haut',
  high: 'Haut',
  normal: 'Normal',
  low: 'Bas',
  very_low: 'Très bas',
};

type RequestsAdminProps = {
  paroisseId: string;
};

function requestSummary(r: RequestRow) {
  const md = r.metadata ?? {};
  try {
    if (r.type === 'wedding') {
      const participants = Array.isArray((md as any).participants) ? (md as any).participants : [];
      const first = participants[0];
      if (first) {
        const full = [first.lastName, first.firstName].filter(Boolean).join(' ');
        return full || r.description || 'Demande mariage';
      }
      return r.description || 'Demande mariage';
    }
    if (r.type === 'baptism') {
      const child = (md as any).child ?? null;
      if (child) {
        const full = [child.lastName, child.firstName].filter(Boolean).join(' ');
        const birth = child.birthDate ? ` — né(e) le ${child.birthDate}` : '';
        return (full || 'Baptême') + birth;
      }
      return r.description || 'Demande baptême';
    }
    if (r.type === 'confession') {
      return `${r.duration_minutes ? `${r.duration_minutes} min` : 'Durée'} — ${r.description || 'Demande confession'}`;
    }
  } catch {
    // noop
  }
  return r.description || 'Demande';
}

export default function RequestsAdmin({ paroisseId }: RequestsAdminProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [officiants, setOfficiants] = useState<OfficiantRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);

  const [filterType, setFilterType] = useState<'all' | CulteRequestType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | RequestStatus>('all');

  const [drafts, setDrafts] = useState<
    Record<
      string,
      { status: RequestStatus; admin_notes: string; preferred_officiant_id: string | null }
    >
  >({});

  const refresh = async () => {
    setLoading(true);
    try {
      const [offs, reqs] = await Promise.all([
        listAllOfficiantsAdmin(paroisseId),
        listRequestsAdmin(paroisseId, {
          type: filterType === 'all' ? undefined : filterType,
          status: filterStatus === 'all' ? undefined : filterStatus,
        }),
      ]);
      setOfficiants(offs);
      setRequests(reqs);

      setDrafts((prev) => {
        const next = { ...prev };
        for (const r of reqs) {
          if (!next[r.id]) {
            next[r.id] = {
              status: r.status,
              admin_notes: r.admin_notes ?? '',
              preferred_officiant_id: r.preferred_officiant_id ?? null,
            };
          }
        }
        return next;
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paroisseId, filterType, filterStatus]);

  const handleSave = async (requestId: string) => {
    const d = drafts[requestId];
    if (!d) return;

    setLoading(true);
    try {
      await updateRequestAdmin(requestId, {
        status: d.status,
        admin_notes: d.admin_notes.trim() || null,
        preferred_officiant_id: d.preferred_officiant_id,
      });
      toast({ title: 'Demande mise à jour' });
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const typeLabel = (t: CulteRequestType) => {
    if (t === 'wedding') return 'Mariage';
    if (t === 'baptism') return 'Baptême';
    return 'Confession';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin — Demandes Culte & Prière</CardTitle>
          <CardDescription>Filtres, assignation d’officiant et changement de statut.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filtres</span>
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="wedding">Mariage</SelectItem>
                <SelectItem value="baptism">Baptême</SelectItem>
                <SelectItem value="confession">Confession</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvée</SelectItem>
                <SelectItem value="rejected">Refusée</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>

            <Button type="button" onClick={() => void refresh()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Rafraîchir
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && requests.length === 0 ? (
        <div className="text-sm text-muted-foreground">Chargement…</div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const d = drafts[r.id];
            const summary = requestSummary(r);
            const preferredLabel = officiants.find((o) => o.id === (d?.preferred_officiant_id ?? r.preferred_officiant_id))?.name;

            return (
              <Card key={r.id} className="shadow-sm">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{typeLabel(r.type)}</Badge>
                        <Badge variant="outline">{STATUS_LABEL[r.status]}</Badge>
                        <Badge variant="outline">{PRIORITY_LABEL[r.priority]}</Badge>
                        {r.is_anonymous ? <Badge variant="destructive">Anonyme</Badge> : null}
                      </div>
                      <div className="text-sm text-muted-foreground">{new Date(r.preferred_date ?? r.created_at).toLocaleString('fr-FR')}</div>
                      <div className="font-medium">{summary}</div>
                      {r.description ? <div className="text-sm">{r.description}</div> : null}
                      {!r.is_anonymous && r.user_name ? (
                        <div className="text-xs text-muted-foreground">Par {r.user_name}</div>
                      ) : null}
                    </div>

                    <div className="w-full sm:w-[340px] space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Statut</label>
                        <Select
                          value={(d?.status ?? r.status) as string}
                          onValueChange={(v) => {
                            setDrafts((prev) => ({
                              ...prev,
                              [r.id]: {
                                status: v as RequestStatus,
                                admin_notes: d?.admin_notes ?? r.admin_notes ?? '',
                                preferred_officiant_id: d?.preferred_officiant_id ?? r.preferred_officiant_id ?? null,
                              },
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="approved">Approuvée</SelectItem>
                            <SelectItem value="rejected">Refusée</SelectItem>
                            <SelectItem value="completed">Terminée</SelectItem>
                            <SelectItem value="cancelled">Annulée</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Officiant assigné</label>
                        <Select
                          value={String(d?.preferred_officiant_id ?? r.preferred_officiant_id ?? '__none')}
                          onValueChange={(v) => {
                            setDrafts((prev) => ({
                              ...prev,
                              [r.id]: {
                                status: d?.status ?? r.status,
                                admin_notes: d?.admin_notes ?? r.admin_notes ?? '',
                                preferred_officiant_id: v === '__none' ? null : v,
                              },
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Officiant" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none">— Non assigné —</SelectItem>
                            {officiants.map((o) => (
                              <SelectItem key={o.id} value={o.id}>
                                {o.name}
                                {o.title ? ` (${o.title})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Notes admin</label>
                        <Textarea
                          value={d?.admin_notes ?? r.admin_notes ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDrafts((prev) => ({
                              ...prev,
                              [r.id]: {
                                status: d?.status ?? r.status,
                                admin_notes: v,
                                preferred_officiant_id: d?.preferred_officiant_id ?? r.preferred_officiant_id ?? null,
                              },
                            }));
                          }}
                          rows={3}
                          placeholder="Notes internes (non visibles selon vos règles RLS/UI)."
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void refresh()}
                          disabled={loading}
                        >
                          Annuler
                        </Button>
                        <Button
                          type="button"
                          onClick={() => void handleSave(r.id)}
                          disabled={loading}
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Enregistrer
                        </Button>
                      </div>
                      {preferredLabel ? <div className="text-xs text-muted-foreground">Assigné : {preferredLabel}</div> : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {requests.length === 0 ? <div className="text-sm text-muted-foreground">Aucune demande.</div> : null}
        </div>
      )}
    </div>
  );
}

