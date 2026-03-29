import { useLocation } from 'react-router-dom';
import HeroBanner from '@/components/HeroBanner';
import usePageHero from '@/hooks/usePageHero';
import RequestsAdmin from '@/components/culte/RequestsAdmin';
import { useParoisse } from '@/contexts/ParoisseContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminCulteRequests() {
  const location = useLocation();
  const { paroisse } = useParoisse();
  const paroisseId = paroisse?.id ?? null;
  const { data: hero, save: saveHero } = usePageHero(location.pathname);

  if (!paroisseId) {
    return (
      <div>
        <HeroBanner
          title="Admin — Demandes Culte & Prière"
          subtitle="Gestion et modération"
          showBackButton={true}
          backgroundImage={hero?.image_url}
          onBgSave={saveHero}
        />
        <div className="max-w-6xl mx-auto px-4 py-10">
          <Alert variant="destructive">
            <AlertTitle>Paroisse requise</AlertTitle>
            <AlertDescription>Veuillez sélectionner une paroisse.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div>
      <HeroBanner
        title="Admin — Demandes Culte & Prière"
        subtitle="Filtres, assignation et statuts"
        showBackButton={true}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <RequestsAdmin paroisseId={paroisseId} />
      </div>
    </div>
  );
}

