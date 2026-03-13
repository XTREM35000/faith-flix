import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ConfigText() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contenu texte</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Ici viendront les formulaires pour éditer le footer, les informations de
        contact détaillées, la page &laquo;&nbsp;À propos&nbsp;&raquo; et les
        mentions légales, en s’appuyant sur les sections dynamiques de{" "}
        <code className="mx-1">homepage_sections</code> et les pages statiques.
      </CardContent>
    </Card>
  );
}

