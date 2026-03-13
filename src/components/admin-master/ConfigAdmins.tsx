import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ConfigAdmins() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rôles Admin &amp; Master</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Gestion des administrateurs et du rôle &laquo; Master &raquo; (par
        exemple basé sur le rôle <code className="mx-1">super_admin</code> de
        la table <code className="mx-1">profiles</code>). Liste, promotion et
        révocation seront implémentées ici.
      </CardContent>
    </Card>
  );
}

