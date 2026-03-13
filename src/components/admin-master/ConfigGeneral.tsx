import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ConfigGeneral() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration générale</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Paramétrez ici le logo, le nom de la paroisse, les couleurs principales
        et la favicon. (À implémenter en s’appuyant sur les tables
        <code className="mx-1">header_config</code> et la configuration thème.)
      </CardContent>
    </Card>
  );
}

