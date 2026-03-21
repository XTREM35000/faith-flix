import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Building2, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import HeroBanner from '@/components/HeroBanner';
import usePageHero from '@/hooks/usePageHero';
import useRoleCheck from '@/hooks/useRoleCheck';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ParoisseFormModal } from '@/components/ParoisseFormModal';
import {
  fetchParoissesForAdmin,
  deleteParoisseById,
  type ParoisseAdminRow,
} from '@/lib/supabase/paroisseAdminQueries';

const AdminParoisses: React.FC = () => {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { hasRole } = useRoleCheck();
  const { toast } = useToast();

  const [rows, setRows] = useState<ParoisseAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ParoisseAdminRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ParoisseAdminRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isSuper = hasRole('super_admin');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await fetchParoissesForAdmin();
      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les paroisses (vérifiez la connexion et les droits RLS).',
        variant: 'destructive',
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isSuper) void load();
  }, [isSuper, load]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (p: ParoisseAdminRow) => {
    setEditing(p);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await deleteParoisseById(deleteTarget.id);
      if (error) throw error;
      toast({ title: 'Paroisse supprimée', description: deleteTarget.nom });
      setDeleteTarget(null);
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({
        title: 'Suppression impossible',
        description:
          msg.includes('foreign key') || msg.includes('violates')
            ? 'Cette paroisse est encore liée à des contenus (vidéos, événements…). Retirez les liens ou désactivez-la.'
            : msg,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!isSuper) {
    return (
      <div className="min-h-screen bg-background">
        <HeroBanner
          title="Paroisses"
          subtitle="Réservé aux super administrateurs"
          showBackButton
          backgroundImage={hero?.image_url}
          onBgSave={saveHero}
        />
        <main className="container mx-auto max-w-lg px-4 py-16 text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Accès refusé</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Seul le rôle <strong>super_admin</strong> peut gérer les paroisses.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner
        title="Paroisses"
        subtitle="Création et gestion des paroisses (multi-sites)"
        showBackButton
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <main className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {rows.length} paroisse{rows.length !== 1 ? 's' : ''} en base
          </p>
          <Button onClick={openCreate} className="gap-2 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            Nouvelle paroisse
          </Button>
        </div>

        <div className="rounded-md border border-border bg-card">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Chargement…
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              Aucune paroisse. Créez-en une pour commencer.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="w-[100px]">Actif</TableHead>
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nom}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{p.slug}</TableCell>
                    <TableCell>
                      {p.is_active ? (
                        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600">
                          Oui
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Non</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="Modifier" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        title="Supprimer"
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>

      <ParoisseFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        paroisse={editing}
        onSaved={load}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette paroisse ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? (
                <>
                  « {deleteTarget.nom} » sera définitivement supprimée si aucune donnée ne la référence
                  (contraintes SQL).
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleting}
            >
              {deleting ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminParoisses;
