import { useLocation } from 'react-router-dom';
import HeroBanner from '@/components/HeroBanner';
import usePageHero from '@/hooks/usePageHero';
import FAQSection from '@/components/culte/FAQSection';
import { useParoisse } from '@/contexts/ParoisseContext';
import useRoleCheck from '@/hooks/useRoleCheck';
import { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CulteFaq() {
  const location = useLocation();
  const { paroisse } = useParoisse();
  const paroisseId = paroisse?.id ?? null;
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { isAdmin } = useRoleCheck();

  const content = useMemo(() => {
    if (!paroisseId) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Paroisse requise</AlertTitle>
          <AlertDescription>Veuillez sélectionner une paroisse avant de consulter la FAQ.</AlertDescription>
        </Alert>
      );
    }
    return <FAQSection paroisseId={paroisseId} isAdmin={isAdmin} />;
  }, [isAdmin, paroisseId]);

  return (
    <div>
      <HeroBanner
        title="FAQ sans censure"
        subtitle="Questions publiques, réponses après validation."
        showBackButton={true}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <div className="max-w-6xl mx-auto px-4 py-10">{content}</div>
    </div>
  );
}

