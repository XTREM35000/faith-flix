import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Upload,
  RefreshCw,
  HardDrive,
  Eye,
  AlertTriangle,
  Save,
  Database,
  History,
  Trash,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchBackups as fetchBackupsQuery, deleteBackup as deleteBackupQuery } from '@/lib/supabase/backupQueries';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Backup = {
  id: string;
  name: string | null;
  description: string | null;
  data: unknown;
  size: number | null;
  created_at: string;
  created_by: string | null;
  type?: string | null;
};

interface BackupRestoreProps {
  isMaster: boolean;
}

export function BackupRestore({ isMaster }: BackupRestoreProps) {
  const { toast } = useToast();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [fullBackingUp, setFullBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreDb, setRestoreDb] = useState(true);
  const [restoreBuckets, setRestoreBuckets] = useState(true);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Backup | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    if (isMaster) {
      void fetchBackups();
    }
  }, [isMaster]);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const data = await fetchBackupsQuery();
      setBackups(data || []);
    } catch (e) {
      console.error("[AdminMaster] Erreur chargement backups:", e);
      toast({
        title: "Erreur",
        description: "Impossible de charger les sauvegardes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const computeSize = (obj: unknown) => {
    try {
      const json = JSON.stringify(obj);
      return new Blob([json]).size;
    } catch {
      return null;
    }
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      // Récupération de quelques tables clés de configuration
      const [homepageRes, headerRes, heroesRes] = await Promise.all([
        supabase.from("homepage_sections").select("*"),
        supabase.from("header_config").select("*").limit(1),
        supabase.from("page_hero_banners").select("*"),
      ]);

      if (homepageRes.error) throw homepageRes.error;
      if (headerRes.error) throw headerRes.error;
      if (heroesRes.error) throw heroesRes.error;

      const payload = {
        homepage_sections: homepageRes.data,
        header_config: headerRes.data,
        page_hero_banners: heroesRes.data,
      };

      const size = computeSize(payload);

      const { error: insertError } = await supabase.from("backups").insert({
        name: newName || "Sauvegarde configuration",
        description:
          newDescription ||
          "Sauvegarde automatique de la configuration principale",
        data: payload,
        size,
      });

      if (insertError) throw insertError;

      toast({
        title: "Sauvegarde créée",
        description: "La configuration a été sauvegardée avec succès.",
      });
      setNewName("");
      setNewDescription("");
      await fetchBackups();
    } catch (e) {
      console.error("[AdminMaster] Erreur création sauvegarde:", e);
      toast({
        title: "Erreur",
        description:
          "Impossible de créer la sauvegarde. Vérifiez vos droits et réessayez.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const createFullBackup = async () => {
    setFullBackingUp(true);
    try {
      const { data, error } = await supabase.functions.invoke("backup-full", {
        body: {},
      });

      if (error) {
        throw error;
      }

      const stats = (data as any)?.stats;

      toast({
        title: "Sauvegarde complète créée",
        description:
          stats && typeof stats === "object"
            ? `Tables: ${stats.tables ?? "?"}, buckets: ${
                stats.buckets ?? "?"
              }, fichiers: ${stats.total_files ?? "?"}`
            : "La base de données et les buckets ont été sauvegardés.",
      });

      await fetchBackups();
    } catch (e) {
      console.error("[AdminMaster] Erreur backup-full:", e);
      toast({
        title: "Erreur",
        description:
          "Impossible de créer la sauvegarde complète (DB + fichiers).",
        variant: "destructive",
      });
    } finally {
      setFullBackingUp(false);
    }
  };

  const handleDownload = (backup: Backup) => {
    try {
      const blob = new Blob([JSON.stringify(backup.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName =
        backup.name?.replace(/[^\w\d-_]+/g, "_") || "backup_configuration";
      a.download = `${safeName}_${backup.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("[AdminMaster] Erreur téléchargement sauvegarde:", e);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger cette sauvegarde.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const size = computeSize(json);

      const { error } = await supabase.from("backups").insert({
        name: `Import ${file.name}`,
        description: "Sauvegarde importée manuellement",
        data: json,
        size,
      });
      if (error) throw error;

      toast({
        title: "Import réussi",
        description: "La sauvegarde a été importée dans Supabase.",
      });
      await fetchBackups();
    } catch (e) {
      console.error("[AdminMaster] Erreur import sauvegarde:", e);
      toast({
        title: "Erreur",
        description:
          "Le fichier sélectionné n'est pas une sauvegarde valide (JSON).",
        variant: "destructive",
      });
    } finally {
      event.target.value = "";
    }
  };

  const openPreview = (backup: Backup) => {
    setSelectedBackup(backup);
    setPreviewOpen(true);
  };

  const requestRestore = (backup: Backup) => {
    setRestoreTarget(backup);
    setRestoreDialogOpen(true);
  };

  const requestDelete = (backup: Backup) => {
    setDeleteTarget(backup);
    setDeleteDialogOpen(true);
  };

  const performDelete = async () => {
    if (!deleteTarget) return;
    setDeleteDialogOpen(false);
    try {
      setLoading(true);
      const res = await deleteBackupQuery(deleteTarget.id);
      if (res.deleted) {
        toast({ title: 'Sauvegarde supprimée' });
      } else if (res.reason === 'latest') {
        toast({ title: 'Action refusée', description: "Impossible de supprimer la dernière sauvegarde.", variant: 'destructive' });
      }
      await fetchBackups();
    } catch (e) {
      console.error('[AdminMaster] Erreur suppression sauvegarde:', e);
      toast({ title: 'Erreur', description: 'Impossible de supprimer la sauvegarde.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    try {
      setRestoring(true);
      const { data, error } = await supabase.functions.invoke("restore-full", {
        body: { backupId, restoreDb, restoreBuckets },
      });

      if (error) throw error;

      console.log("[AdminMaster] Restauration complète terminée:", data);
      const results = (data as any)?.results;
      toast({
        title: "Restauration réussie",
        description:
          results && typeof results === "object"
            ? `Tables restaurées: ${
                Object.keys(results.db || {}).length
              }, buckets: ${Object.keys(results.buckets || {}).length}`
            : "La sauvegarde a été restaurée.",
      });
      await fetchBackups();
    } catch (err) {
      console.error("[AdminMaster] Erreur lors de la restauration:", err);
      toast({
        title: "Erreur",
        description: "Erreur lors de la restauration de la sauvegarde.",
        variant: "destructive",
      });
    } finally {
      setRestoring(false);
    }
  };

  const performRestore = async () => {
    if (!restoreTarget) return;
    setRestoreDialogOpen(false);
    await handleRestore(restoreTarget.id);
  };

  if (!isMaster) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accès restreint</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Seuls les administrateurs Master peuvent gérer les sauvegardes
          complètes du site.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              Sauvegarde &amp; restauration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Créez une sauvegarde complète de la configuration (page d'accueil,
              header, bannières...) avant toute modification importante. Vous
              pourrez ensuite restaurer l'état précédent en cas de besoin.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Input
                  placeholder="Nom de la sauvegarde (facultatif)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <Textarea
                  rows={3}
                  placeholder="Description / commentaire (facultatif)"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={createBackup}
                    disabled={creating}
                    className="flex items-center gap-2"
                  >
                    {creating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <HardDrive className="h-4 w-4" />
                    )}
                    Créer une sauvegarde
                  </Button>
                  <Button
                    variant="default"
                    onClick={createFullBackup}
                    disabled={fullBackingUp}
                    className="flex items-center gap-2"
                  >
                    {fullBackingUp ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                      </>
                    )}
                    Sauvegarde complète (DB + fichiers)
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => void fetchBackups()}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Actualiser la liste
                  </Button>
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <Upload className="h-4 w-4" />
                    Importer une sauvegarde
                    <input
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={handleImport}
                    />
                  </label>
                </div>
              </div>

              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">
                  Bonnes pratiques
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Créez une sauvegarde avant toute action critique.</li>
                  <li>
                    Téléchargez périodiquement une copie locale des sauvegardes.
                  </li>
                  <li>
                    Limitez les restaurations aux cas d'incident ou de
                    réinitialisation majeure.
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique des sauvegardes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Chargement des sauvegardes...
              </p>
            ) : backups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune sauvegarde enregistrée pour le moment.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Taille</TableHead>
                      <TableHead className="text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((b) => {
                      const type = (b.type || "config").toLowerCase();
                      const label =
                        type === "full"
                          ? "Complète"
                          : type === "db_only"
                          ? "Base de données"
                          : type === "buckets_only"
                          ? "Fichiers"
                          : "Configuration";

                      const typeClasses =
                        type === "full"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : type === "db_only"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : type === "buckets_only"
                          ? "bg-violet-50 text-violet-700 border-violet-200"
                          : "bg-slate-50 text-slate-700 border-slate-200";

                      const sizeLabel =
                        b.size != null
                          ? b.size > 1024 * 1024
                            ? `${(b.size / 1024 / 1024).toFixed(1)} Mo`
                            : `${(b.size / 1024).toFixed(1)} Ko`
                          : "—";

                      return (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">
                            {b.name || "Sauvegarde sans nom"}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {b.description || "—"}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeClasses}`}
                            >
                              {label}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(b.created_at).toLocaleString("fr-FR")}
                          </TableCell>
                          <TableCell>{sizeLabel}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Voir le contenu"
                              onClick={() => openPreview(b)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Télécharger"
                              onClick={() => handleDownload(b)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Supprimer"
                              onClick={() => requestDelete(b)}
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-1"
                              onClick={() => requestRestore(b)}
                              disabled={restoring}
                            >
                              {restoring ? (
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <History className="h-3 w-3 mr-1" />
                              )}
                              Restaurer
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Aperçu de la sauvegarde</DialogTitle>
            <DialogDescription>
              Visualisation brute du contenu JSON stocké. Le comparatif fin
              avant restauration pourra être implémenté côté client ultérieurement.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto rounded bg-muted text-xs p-3 font-mono">
            <pre>
              {selectedBackup
                ? JSON.stringify(selectedBackup.data, null, 2)
                : "Aucune sauvegarde sélectionnée."}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la restauration</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de restaurer la configuration à partir de{" "}
              <span className="font-semibold">
                {restoreTarget?.name || "cette sauvegarde"}
              </span>
              . <br />
              Cette opération est potentiellement destructive et devrait être
              précédée d'une nouvelle sauvegarde récente. La logique complète
              d'application du snapshot doit être implémentée dans une Edge
              Function sécurisée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={performRestore}>
              Continuer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez‑vous vraiment supprimer la sauvegarde <strong>{deleteTarget?.name || 'sélectionnée'}</strong> ?
              Cette opération est irréversible. La suppression sera refusée si il s'agit de la dernière sauvegarde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={performDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

