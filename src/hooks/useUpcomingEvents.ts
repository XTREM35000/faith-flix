import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  time?: string;
  location: string;
  imageUrl?: string;
  attendees?: number;
  created_at?: string;
  updated_at?: string;
}

export const useUpcomingEvents = (limit = 10) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Récupérer les événements futurs triés par start_date (timestamp)
        const today = new Date().toISOString();

        const { data, error: fetchError } = await supabase
          .from('events')
          .select('*')
          .gte('start_date', today)
          .order('start_date', { ascending: true })
          .limit(limit);
        
        if (fetchError) throw fetchError;
        
        if (data) {
          // Mapper les données avec les noms attendus
          const mappedEvents: Event[] = data.map((item: Record<string, unknown>) => ({
            id: item.id as string,
            title: item.title as string,
            description: item.description as string | undefined,
            start_date: (item.start_date as string) || (item.startDate as string) || '',
            time: item.time as string | undefined,
            location: item.location as string,
            imageUrl: (item.image_url as string | null) || (item.imageUrl as string | null),
            attendees: item.attendees as number | undefined,
            created_at: item.created_at as string | undefined,
            updated_at: item.updated_at as string | undefined,
          }));
          
          setEvents(mappedEvents);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des événements:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [limit]);

  return { events, loading, error };
};
