import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  castFaqVote,
  fetchPublishedFaqs,
  insertFaqQuestion,
  listFaqsAdmin,
  updateFaqAdmin,
} from '@/lib/supabase/culteApi';
import type { FaqModerationStatus, FaqRow } from '@/types/culte';
import { Loader2, ThumbsDown, ThumbsUp, Pin } from 'lucide-react';

type FAQSectionProps = {
  paroisseId: string;
  isAdmin: boolean;
};

function statusBadgeVariant(status: string): { variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  const s = String(status || '').toLowerCase();
  if (s === 'published') return { variant: 'default' };
  if (s === 'rejected') return { variant: 'destructive' };
  return { variant: 'outline' };
}

function prettyVoteCounts(f: FaqRow) {
  return { up: f.votes_up ?? 0, down: f.votes_down ?? 0 };
}

export default function FAQSection({ paroisseId, isAdmin }: FAQSectionProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FaqRow[]>([]);

  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Admin-only inputs per row
  const [adminDrafts, setAdminDrafts] = useState<Record<string, { answer: string; moderation_status: FaqModerationStatus; is_pinned: boolean; category: string }>>({});

  const listFn = useMemo(() => {
    return isAdmin ? listFaqsAdmin : fetchPublishedFaqs;
  }, [isAdmin]);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listFn(paroisseId);
      setItems(data);
      // Initialise les drafts admin (answer/status/pin) à partir des données.
      setAdminDrafts((prev) => {
        const next = { ...prev };
        for (const it of data) {
          if (!next[it.id]) {
            next[it.id] = {
              answer: it.answer ?? '',
              moderation_status: (it.moderation_status ?? 'pending') as FaqModerationStatus,
              is_pinned: !!it.is_pinned,
              category: it.category ?? '',
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
  }, [paroisseId, isAdmin]);

  const handleSubmitQuestion = async () => {
    const q = question.trim();
    if (!q) {
      toast({ title: 'Question requise', description: 'Veuillez saisir une question.', variant: 'destructive' });
      return;
    }

    if (q.length < 5) {
      toast({ title: 'Question trop courte', description: 'Ajoutez plus de détails (min. 5 caractères).', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await insertFaqQuestion({
        paroisse_id: paroisseId,
        question: q,
        category: category.trim() || null,
        author_name: isAnonymous ? null : (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? null,
        author_email: isAnonymous ? null : user?.email ?? null,
        user_id: user?.id ?? null,
        is_anonymous: isAnonymous,
      });

      toast({ title: 'Question envoyée', description: 'Elle sera publiée après modération.' });
      setQuestion('');
      setCategory('');
      setIsAnonymous(false);
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCastVote = async (faqId: string, vote: 1 | -1) => {
    try {
      if (!user) {
        toast({ title: 'Connexion requise', description: 'Connectez-vous pour voter.', variant: 'destructive' });
        return;
      }
      await castFaqVote(faqId, vote);
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    }
  };

  const handleAdminUpdate = async (faqId: string) => {
    const draft = adminDrafts[faqId];
    if (!draft) return;
    setLoading(true);
    try {
      await updateFaqAdmin(faqId, {
        answer: draft.answer.trim() || null,
        moderation_status: draft.moderation_status,
        category: draft.category.trim() || null,
        is_pinned: draft.is_pinned,
      });
      toast({ title: 'FAQ mise à jour' });
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>FAQ sans censure</CardTitle>
          <CardDescription>
            {isAdmin
              ? 'Modération : valider / refuser, rédiger des réponses et épingler.'
              : 'Posez une question : elle sera publiée après validation.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAdmin ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox checked={isAnonymous} onCheckedChange={(c) => setIsAnonymous(c === true)} id="faq-anon" />
                <div className="space-y-1">
                  <label htmlFor="faq-anon" className="text-sm font-medium cursor-pointer">
                    Anonyme (important pour la confidentialité)
                  </label>
                  <p className="text-xs text-muted-foreground">Votre nom/email ne seront pas visibles.</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Question</label>
                <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} placeholder="Écrivez votre question…" />
              </div>
              <div>
                <label className="text-sm font-medium">Catégorie (optionnel)</label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="ex: mariage, baptême, prière…" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" onClick={handleSubmitQuestion} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Envoyer
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {loading ? 'Chargement…' : 'Vous êtes en mode admin.'}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading && items.length === 0 ? (
          <div className="text-sm text-muted-foreground">Chargement des FAQ…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">Aucune FAQ pour le moment.</div>
        ) : (
          items.map((f) => {
            const v = prettyVoteCounts(f);
            return (
              <Card key={f.id} className="shadow-sm">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{f.question}</CardTitle>
                        {f.is_pinned ? (
                          <Badge variant="outline" className="gap-1">
                            <Pin className="h-3 w-3" />
                            Épinglée
                          </Badge>
                        ) : null}
                        {isAdmin ? (
                          <Badge {...statusBadgeVariant(f.moderation_status ?? 'pending')} className="capitalize">
                            {f.moderation_status ?? 'pending'}
                          </Badge>
                        ) : null}
                      </div>
                      {f.category ? <div className="text-xs text-muted-foreground">Catégorie : {f.category}</div> : null}
                    </div>
                  </div>

                  {f.answer ? (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      <span className="font-medium">Réponse :</span> {f.answer}
                    </div>
                  ) : isAdmin ? (
                    <div className="text-sm text-muted-foreground">Pas encore de réponse.</div>
                  ) : null}

                  {!isAdmin ? (
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => void handleCastVote(f.id, 1)}>
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {v.up}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => void handleCastVote(f.id, -1)}>
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        {v.down}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium">Catégorie</label>
                          <Input
                            value={adminDrafts[f.id]?.category ?? ''}
                            onChange={(e) =>
                              setAdminDrafts((prev) => ({
                                ...prev,
                                [f.id]: {
                                  ...(prev[f.id] ?? {
                                    answer: f.answer ?? '',
                                    moderation_status: (f.moderation_status ?? 'pending') as FaqModerationStatus,
                                    is_pinned: !!f.is_pinned,
                                    category: f.category ?? '',
                                  }),
                                  category: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Statut</label>
                          <Select
                            value={(adminDrafts[f.id]?.moderation_status ?? (f.moderation_status ?? 'pending')) as string}
                            onValueChange={(v) =>
                              setAdminDrafts((prev) => ({
                                ...prev,
                                [f.id]: {
                                  ...(prev[f.id] ?? {
                                    answer: f.answer ?? '',
                                    moderation_status: (f.moderation_status ?? 'pending') as FaqModerationStatus,
                                    is_pinned: !!f.is_pinned,
                                    category: f.category ?? '',
                                  }),
                                  moderation_status: v as FaqModerationStatus,
                                },
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">En attente</SelectItem>
                              <SelectItem value="published">Publiée</SelectItem>
                              <SelectItem value="rejected">Refusée</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={adminDrafts[f.id]?.is_pinned ?? !!f.is_pinned}
                          onCheckedChange={(c) =>
                            setAdminDrafts((prev) => ({
                              ...prev,
                              [f.id]: {
                                ...(prev[f.id] ?? {
                                  answer: f.answer ?? '',
                                  moderation_status: (f.moderation_status ?? 'pending') as FaqModerationStatus,
                                  is_pinned: !!f.is_pinned,
                                  category: f.category ?? '',
                                }),
                                is_pinned: c === true,
                              },
                            }))
                          }
                          id={`faq-pin-${f.id}`}
                        />
                        <label htmlFor={`faq-pin-${f.id}`} className="text-sm font-medium cursor-pointer">
                          Épingler
                        </label>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Réponse (admin)</label>
                        <Textarea
                          value={adminDrafts[f.id]?.answer ?? ''}
                          onChange={(e) =>
                            setAdminDrafts((prev) => ({
                              ...prev,
                              [f.id]: {
                                ...(prev[f.id] ?? {
                                  answer: f.answer ?? '',
                                  moderation_status: (f.moderation_status ?? 'pending') as FaqModerationStatus,
                                  is_pinned: !!f.is_pinned,
                                  category: f.category ?? '',
                                }),
                                answer: e.target.value,
                              },
                            }))
                          }
                          rows={3}
                          placeholder="Rédigez une réponse…"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => void refresh()} disabled={loading}>
                          Annuler
                        </Button>
                        <Button type="button" onClick={() => void handleAdminUpdate(f.id)} disabled={loading}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Enregistrer
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

