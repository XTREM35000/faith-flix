import { useState } from "react";
import { AlertTriangle, Skull, RefreshCw } from "lucide-react";
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

type Step = "idle" | "first" | "second" | "third" | "executing" | "done";

export function ConfigFactoryReset() {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("idle");
  const [confirm1Open, setConfirm1Open] = useState(false);
  const [confirm2Open, setConfirm2Open] = useState(false);
  const [confirm3Open, setConfirm3Open] = useState(false);
  const [textConfirm, setTextConfirm] = useState("");
  const [keepSuperAdmin, setKeepSuperAdmin] = useState(true);
  const [superAdminEmail, setSuperAdminEmail] = useState("");
  const [progress, setProgress] = useState(0);
  const [executing, setExecuting] = useState(false);

  const startSequence = () => {
    setStep("first");
    setConfirm1Open(true);
  };

  const handleFirstConfirm = () => {
    setConfirm1Open(false);
    setStep("second");
    setConfirm2Open(true);
  };

  const handleSecondConfirm = () => {
    if (textConfirm !== "FACTORY RESET") {
      toast({
        title: "Confirmation invalide",
        description:
          'Vous devez taper exactement "FACTORY RESET" pour continuer.',
        variant: "destructive",
      });
      return;
    }
    setConfirm2Open(false);
    setStep("third");
    setConfirm3Open(true);
  };

  const performFactoryReset = async () => {
    setConfirm3Open(false);
    setExecuting(true);
    setStep("executing");
    setProgress(10);

    try {
      // 1. Sauvegarde complète ultime
      setProgress(35);
      const { data: backupData, error: backupError } =
        await supabase.functions.invoke("backup-full", {
          body: {},
        });
      if (backupError) throw backupError;

      const backupId = (backupData as any)?.backup?.id;

      toast({
        title: "Sauvegarde ultime créée",
        description:
          backupId != null
            ? `Backup ID: ${backupId}`
            : "Une sauvegarde complète (DB + fichiers) a été créée.",
      });

      setProgress(65);

      // 2. Appel de factory-reset
      const { data, error } = await supabase.functions.invoke(
        "factory-reset",
        {
          body: {
            keepSuperAdmin,
            superAdminEmail: keepSuperAdmin ? superAdminEmail || null : null,
          },
        }
      );

      if (error) throw error;

      setProgress(95);
      const payload = data as any;

      toast({
        title: "Factory Reset terminé",
        description:
          payload && payload.finishedAt
            ? `Terminé à ${new Date(
                payload.finishedAt
              ).toLocaleString("fr-FR")}`
            : "Le site a été remis à nu. Vous pouvez maintenant le reconfigurer pour une nouvelle paroisse.",
      });

      setProgress(100);
      setStep("done");
    } catch (e) {
      console.error("[FactoryReset] Erreur pendant la mise à nu complète:", e);
      toast({
        title: "Erreur",
        description:
          "Une erreur est survenue pendant le Factory Reset. Vérifiez les logs des Edge Functions.",
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
      <Card className="border-red-300">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <Skull className="h-5 w-5" />
            🏭 MISE À NU COMPLÈTE – FACTORY RESET
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            Cette opération supprime <span className="font-semibold">tout</span>{" "}
            le contenu du site (médias, dons, événements, messages, annonces,
            homélies, etc.) et vide les principaux buckets de stockage pour
            repartir sur une base vierge, prête pour une{" "}
            <span className="font-semibold">nouvelle paroisse</span>.
          </p>

          <div className="space-y-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
            <p className="text-xs text-red-900 font-semibold">
              Ce qui est conservé :
            </p>
            <ul className="text-xs text-red-900/80 list-disc list-inside space-y-1">
              <li>Comptes utilisateurs et rôles (dont les super_admin).</li>
              <li>Structure des tables et configuration technique Supabase.</li>
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-2">
                  Conserver au moins un super_admin
                  <Switch
                    checked={keepSuperAdmin}
                    onCheckedChange={setKeepSuperAdmin}
                  />
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Recommandé : permet de garder un compte maître après le reset.
                </p>
              </div>
              {keepSuperAdmin && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium">
                    Email du super_admin à conserver
                  </Label>
                  <Input
                    type="email"
                    value={superAdminEmail}
                    onChange={(e) => setSuperAdminEmail(e.target.value)}
                    placeholder="ex: admin@paroisse-ci.org"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Laissez vide pour conserver tous les super_admin existants.
                  </p>
                </div>
              )}
            </div>

            {step === "executing" && (
              <div className="space-y-2">
                <p className="font-medium flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Factory Reset en cours…
                </p>
                <Progress value={progress} />
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                variant="destructive"
                className="w-full md:w-auto font-semibold flex items-center gap-2"
                onClick={startSequence}
                disabled={executing}
              >
                🧨 Lancer la mise à nu complète
              </Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Étape 1 */}
      <AlertDialog open={confirm1Open} onOpenChange={setConfirm1Open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de lancer un{" "}
              <span className="font-semibold">Factory Reset complet</span>. Cette
              action est <strong>irréversible</strong> pour toutes les données
              effacées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleFirstConfirm}>
              Continuer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Étape 2 */}
      <AlertDialog open={confirm2Open} onOpenChange={setConfirm2Open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation renforcée</AlertDialogTitle>
            <AlertDialogDescription>
              Pour confirmer, tapez{" "}
              <code className="font-mono text-xs">FACTORY RESET</code> ci‑dessous.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Input
              value={textConfirm}
              onChange={(e) => setTextConfirm(e.target.value)}
              placeholder="FACTORY RESET"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleSecondConfirm}>
              Continuer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Étape 3 */}
      <AlertDialog open={confirm3Open} onOpenChange={setConfirm3Open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dernière confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Une <span className="font-semibold">sauvegarde ultime</span> va être
              créée (DB + fichiers) juste avant la mise à nu complète.
              Confirmez‑vous vouloir lancer définitivement le Factory Reset ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={performFactoryReset}>
              Oui, lancer le Factory Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

