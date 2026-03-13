import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuditLogs() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Journal des actions</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Tableau des actions critiques (qui, quoi, quand). Cette section pourra
        consommer une table dédiée (par ex. <code className="mx-1">audit_logs</code>)
        ou les métadonnées stockées avec les sauvegardes.
      </CardContent>
    </Card>
  );
}

