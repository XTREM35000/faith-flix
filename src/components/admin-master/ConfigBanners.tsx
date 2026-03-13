import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ConfigBanners() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bannières (Hero)</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Gestion centralisée des images Hero (accueil, à propos, dons, contact,
        etc.). Cette section pourra utiliser les hooks existants comme{" "}
        <code className="mx-1">usePageHero</code> et la table{" "}
        <code className="mx-1">page_hero_banners</code>.
      </CardContent>
    </Card>
  );
}

