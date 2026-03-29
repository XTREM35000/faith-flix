import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import HeroBanner from '@/components/HeroBanner';
import usePageHero from '@/hooks/usePageHero';
import RequestForm from '@/components/culte/RequestForm';
import { useParoisse } from '@/contexts/ParoisseContext';
import type { OfficiantRow } from '@/types/culte';
import { fetchDailyOfficiant, fetchOfficiants } from '@/lib/supabase/culteApi';
import { Loader2 } from 'lucide-react';

export default function CulteBapteme() {
  const location = useLocation();
  const { paroisse } = useParoisse();
  const paroisseId = paroisse?.id ?? null;

  const { data: hero, save: saveHero } = usePageHero(location.pathname);

  const [officiants, setOfficiants] = useState<OfficiantRow[]>([]);
  const [defaultOfficiant, setDefaultOfficiant] = useState<OfficiantRow | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!paroisseId) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const [offs, day] = await Promise.all([
          fetchOfficiants(paroisseId),
          fetchDailyOfficiant(paroisseId, new Date().toISOString()),
        ]);
        if (!cancelled) {
          setOfficiants(offs);
          setDefaultOfficiant(day.officiant);
        }
      } catch {
        if (!cancelled) {
          setOfficiants([]);
          setDefaultOfficiant(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paroisseId]);

  return (
    <div>
      <HeroBanner
        title="Préparatif pour baptême (enfant)"
        subtitle="Indiquez les informations nécessaires pour organiser la célébration."
        showBackButton={true}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <div className="max-w-5xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement…
          </div>
        ) : (
          <RequestForm
            type="baptism"
            paroisseId={paroisseId}
            officiants={officiants}
            defaultOfficiant={defaultOfficiant}
            title="Baptême"
            description="Choisissez votre confidentialité, indiquez les détails de l’enfant et envoyez la demande."
          />
        )}
      </div>
    </div>
  );
}

