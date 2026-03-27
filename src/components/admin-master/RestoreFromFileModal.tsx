import { useEffect, useState } from "react";
import { Upload, RefreshCw, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface RestoreFromFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestoreSuccess?: () => void;
}

export function RestoreFromFileModal({
  open,
  onOpenChange,
  onRestoreSuccess,
}: RestoreFromFileModalProps) {
  const { toast } = useToast();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("backups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBackups((data as Backup[]) || []);
    } catch (e) {
      console.error("[RestoreModal] Erreur chargement backups:", e);
      toast({
        title: "Erreur",
        description: "Impossible de charger les sauvegardes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void fetchBackups();
      setBackupFile(null);
    }
  }, [open]);

  const handleRestoreFromList = async (backupId: string) => {
    setRestoring(backupId);
    try {
      const { data, error } = await supabase.functions.invoke("restore-full", {
        body: {
          backupId,
          restoreDb: true,
          restoreBuckets: true,
        },
      });

      if (error) throw error;

      const results = (data as any)?.results;
      toast({
        title: "Sauvegarde restaurée",
        description:
          results && typeof results === "object"
            ? `Tables restaurées: ${Object.keys(results.db || {}).length}, buckets: ${Object.keys(results.buckets || {}).length}`
            : "La sauvegarde a été restaurée.",
      });
      onOpenChange(false);
      onRestoreSuccess?.();
    } catch (err: any) {
      console.error("[RestoreModal] Erreur restauration:", err);
      toast({
        title: "Erreur",
        description: err?.message || "Erreur lors de la restauration.",
        variant: "destructive",
      });
    } finally {
      setRestoring(null);
    }
  };

  const handleRestoreFromFile = async () => {
    if (!backupFile) return;

    setRestoring("file");
    try {
      const text = await backupFile.text();
      const json = JSON.parse(text);
      const size = new Blob([text]).size;

      const { data: inserted, error: insertError } = await supabase
        .from("backups")
        .insert({
          name: `Import ${backupFile.name}`,
          description: "Sauvegarde restaurée depuis fichier",
          data: json,
          size,
          type: "full",
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      if (!inserted?.id) throw new Error("Insertion échouée");

      const { error } = await supabase.functions.invoke("restore-full", {
        body: {
          backupId: inserted.id,
          restoreDb: true,
          restoreBuckets: true,
        },
      });

      if (error) throw error;

      toast({
        title: "Sauvegarde restaurée",
        description: "La restauration a été effectuée avec succès.",
      });
      setBackupFile(null);
      onOpenChange(false);
      onRestoreSuccess?.();
    } catch (err: any) {
      console.error("[RestoreModal] Erreur restauration fichier:", err);
      toast({
        title: "Erreur",
        description:
          err?.message ||
          "Le fichier n'est peut-être pas une sauvegarde valide.",
        variant: "destructive",
      });
    } finally {
      setRestoring(null);
    }
  };

  const getTypeLabel = (type: string | null | undefined) => {
    const t = (type || "config").toLowerCase();
    return t === "full"
      ? "Complète"
      : t === "db_only"
        ? "Base de données"
        : t === "buckets_only"
          ? "Fichiers"
          : "Configuration";
  };

  const getTypeClasses = (type: string | null | undefined) => {
    const t = (type || "config").toLowerCase();
    return t === "full"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : t === "db_only"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : t === "buckets_only"
          ? "bg-violet-50 text-violet-700 border-violet-200"
          : "bg-slate-50 text-slate-700 border-slate-200";
  };

  const formatSize = (size: number | null) =>
    size != null
      ? size > 1024 * 1024
        ? `${(size / 1024 / 1024).toFixed(1)} Mo`
        : `${(size / 1024).toFixed(1)} Ko`
      : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="z-[100]"
        className="z-[100] max-w-3xl max-h-[85vh] flex flex-col gap-4"
      >
        <DialogHeader>
          <DialogTitle>Restaurer une sauvegarde</DialogTitle>
          <DialogDescription>
            Choisissez une sauvegarde existante (créée manuellement ou par le
            Factory Reset) ou importez un fichier JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Liste des sauvegardes */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Sauvegardes disponibles</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void fetchBackups()}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
            <div className="border rounded-lg overflow-auto max-h-[280px]">
              {loading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Chargement...
                </div>
              ) : backups.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Aucune sauvegarde enregistrée.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Taille</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">
                          {b.name || "Sauvegarde sans nom"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeClasses(b.type)}`}
                          >
                            {getTypeLabel(b.type)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(b.created_at).toLocaleString("fr-FR")}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatSize(b.size)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreFromList(b.id)}
                            disabled={restoring !== null}
                          >
                            {restoring === b.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <History className="h-3 w-3 mr-1" />
                                Restaurer
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* Import fichier */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Ou importer un fichier</p>
            <div className="flex gap-2">
              <Input
                type="file"
                accept=".json,application/json"
                onChange={(e) =>
                  setBackupFile(e.target.files?.[0] || null)
                }
                className="flex-1"
              />
              <Button
                onClick={handleRestoreFromFile}
                disabled={!backupFile || restoring !== null}
              >
                {restoring === "file" ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Restaurer le fichier
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
