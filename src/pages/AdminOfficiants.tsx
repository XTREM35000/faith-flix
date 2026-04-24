import HeroBanner from '@/components/HeroBanner';
import { OfficiantManager } from '@/components/admin/OfficiantManager';
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';

export default function AdminOfficiants() {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title={hero?.title ?? 'Officiants'}
        subtitle={hero?.subtitle ?? 'Gérez les officiants et l’officiant du jour pour les demandes de culte.'}
        showBackButton={false}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl px-4 pt-8 pb-4">
          <h1 className="text-3xl font-bold tracking-tight">Gestion des officiants</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Définissez l’officiant du jour, consultez l’historique des désignations récentes, complétez les fiches (titres,
            photos) et maintenez la liste utilisée sur le site et dans les formulaires.
          </p>
        </div>
        <OfficiantManager />
      </main>
    </div>
  );
}
