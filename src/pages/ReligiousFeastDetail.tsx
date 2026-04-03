import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFeastPrayerIntentions } from '@/hooks/useFeastPrayerIntentions';
import FeastPrayerForm from '@/components/religious-feasts/FeastPrayerForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import type { ReligiousFeast } from '@/types/religiousFeasts';
import { buildSingleFeastIcs, downloadIcsFile } from '@/lib/religiousFeastsIcs';

function buildGoogleCalendarUrl(title: string, date: string, details?: string | null) {
  const start = date.replaceAll('-', '');
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  const end = endDate.toISOString().slice(0, 10).replaceAll('-', '');
  const text = encodeURIComponent(title);
  const dates = `${start}/${end}`;
  const desc = encodeURIComponent(details ?? '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${desc}`;
}

function buildOutlookCalendarUrl(title: string, date: string, details?: string | null) {
  const start = `${date}T00:00:00`;
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  const end = `${endDate.toISOString().slice(0, 10)}T00:00:00`;
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    body: details ?? '',
    startdt: start,
    enddt: end,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export default function ReligiousFeastDetail() {
  const { feastId } = useParams();
  const [feast, setFeast] = useState<ReligiousFeast | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const { intentions, addIntention } = useFeastPrayerIntentions(feastId);

  useEffect(() => {
    const run = async () => {
      if (!feastId) {
        setLoading(false);
        setLoadError(true);
        return;
      }
      setLoading(true);
      setLoadError(false);
      const { data, error } = await supabase.from('religious_feasts').select('*').eq('id', feastId).maybeSingle();
      if (error || !data) {
        setFeast(null);
        setLoadError(true);
      } else {
        setFeast(data as ReligiousFeast);
      }
      setLoading(false);
    };
    void run();
  }, [feastId]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Chargement...</div>;
  }
  if (loadError || !feast) {
    return <div className="container mx-auto px-4 py-8">Fête introuvable.</div>;
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const slug = feast.name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'fete';

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">{feast.name}</h1>
      <p className="text-muted-foreground">{new Date(feast.date).toLocaleDateString('fr-FR')}</p>
      {feast.description ? <p>{feast.description}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Contenu associe</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {feast.gospel_reference ? <p>Evangile: {feast.gospel_reference}</p> : null}
            {feast.prayer_text ? <p>Priere: {feast.prayer_text}</p> : null}
            {feast.reflection_text ? <p>Reflexion: {feast.reflection_text}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ajouter à mon agenda</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="default">
              <a href={buildGoogleCalendarUrl(feast.name, feast.date, feast.description)} target="_blank" rel="noreferrer">
                Google Agenda
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={buildOutlookCalendarUrl(feast.name, feast.date, feast.description)} target="_blank" rel="noreferrer">
                Outlook
              </a>
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const ics = buildSingleFeastIcs(feast, origin);
                downloadIcsFile(`${slug}.ics`, ics);
              }}
            >
              Télécharger .ics
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Intentions de priere</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <FeastPrayerForm onSubmit={addIntention} />
          <div className="space-y-2">
            {intentions.map((it) => (
              <div key={it.id} className="border rounded p-3 text-sm">
                {it.intention}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
