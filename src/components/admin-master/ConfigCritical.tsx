import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export function ConfigCritical() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Actions critiques
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        Cette section regroupera les actions de réinitialisation profonde
        (vider certaines tables, supprimer des images, etc.) avec double
        confirmation et sauvegarde automatique préalable.
      </CardContent>
    </Card>
  );
}

