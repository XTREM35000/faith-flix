import { useState } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

type CleanupStep = "idle" | "confirm" | "executing" | "done";

export function ConfigCritical() {
  const { toast } = useToast();
  const [step, setStep] = useState<CleanupStep>("idle");
  const [confirmText, setConfirmText] = useState("");
  const [shouldResetConfig, setShouldResetConfig] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [executing, setExecuting] = useState(false);

  const startCleanup = () => {
    setConfirmText("");
    setStep("confirm");
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (confirmText !== "SUPPRIMER") {
      toast({
        title: "Confirmation invalide",
        description: 'Vous devez taper exactement "SUPPRIMER" pour continuer.',
        variant: "destructive",
      });
      return;
    }
    setDialogOpen(false);
    void performCleanup();
  };

  const performCleanup = async () => {
    setExecuting(true);
    setStep("executing");
    setProgress(10);

    try {
      // 1. Sauvegarde complète préalable
      setProgress(30);
      await supabase.functions.invoke("backup-full", { body: {} });

      toast({
        title: "Sauvegarde créée",
        description:
          "Une sauvegarde complète (DB + fichiers) a été créée avant le nettoyage.",
      });

      setProgress(60);

      // 2. Appel de cleanup-full
      const { data, error } = await supabase.functions.invoke("cleanup-full", {
        body: { shouldResetConfig, createBackup: false },
      });

      if (error) {
        throw error;
      }

      setProgress(95);
      const results = (data as any)?.results;

      toast({
        title: "Nettoyage terminé",
        description:
          results && typeof results === "object"
            ? `Tables nettoyées: ${
                Object.keys(results.db || {}).length
              }, buckets: ${Object.keys(results.buckets || {}).length}`
            : "Les données non essentielles ont été nettoyées.",
      });

      setProgress(100);
      setStep("done");
    } catch (e) {
      console.error("[CleanupFull] Erreur nettoyages:", e);
      toast({
        title: "Erreur",
        description:
          "Une erreur est survenue pendant le nettoyage. Vérifiez les logs des Edge Functions.",
        variant: "destructive",
      });
      setStep("idle");
      setProgress(0);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <>
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            Nettoyage avancé du contenu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            Utilisez ce module pour vider les contenus non essentiels (médias, dons,
            événements, messages, campagnes…) sans toucher aux comptes utilisateurs.
            Une sauvegarde complète est créée automatiquement avant l’opération.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium">
                  Réinitialiser aussi la configuration d’affichage
                </Label>
                <p className="text-[11px] text-amber-900/80">
                  Supprime également les sections de page d’accueil, bannières et
                  configuration du header/footer. À activer uniquement pour un
                  changement de paroisse.
                </p>
              </div>
              <Switch
                checked={shouldResetConfig}
                onCheckedChange={setShouldResetConfig}
              />
            </div>

            {step === "executing" && (
              <div className="space-y-2">
                <p className="font-medium flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Nettoyage en cours…
                </p>
                <Progress value={progress} />
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-2"
                onClick={startCleanup}
                disabled={executing}
              >
                <Trash2 className="h-4 w-4" />
                Lancer le nettoyage avancé
              </Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le nettoyage</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de supprimer les contenus non essentiels. Cette
              opération est irréversible pour les données effacées. Une sauvegarde
              complète a toutefois été effectuée juste avant.
              <br />
              <span className="mt-2 block">
                Pour confirmer, tapez{" "}
                <code className="font-mono text-xs">SUPPRIMER</code> ci‑dessous.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirmer le nettoyage
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


