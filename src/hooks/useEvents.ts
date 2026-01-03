import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotification } from '@/components/ui/notification-system';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as unknown as any;

interface Event {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  image_url?: string | null;
  views?: number;
  created_at?: string;
  user_id?: string;
}

type EventInsertData = {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  image_url?: string | null;
  user_id?: string;
  created_at?: string;
};

type EventUpdateData = Partial<Omit<Event, 'id' | 'created_at'>>;

export const useEvents = (limit = 10) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotification();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const client = sb;
      const query = client
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      const res = await query.limit(limit);
      const { data, error: fetchError } = res as { data: unknown[] | null; error: unknown };

      if (fetchError) {
        throw fetchError;
      }

      setEvents((data || []) as Event[]);
    } catch (err) {
      console.error('Erreur lors du chargement des événements:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      notifyError('Erreur', 'Impossible de charger les événements');
    } finally {
      setLoading(false);
    }
  }, [limit, notifyError]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (eventData: EventInsertData) => {
    try {
      console.debug('📅 Creating event with data:', eventData);

      const insertData = {
        title: eventData.title,
        description: eventData.description,
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        location: eventData.location,
        image_url: eventData.image_url,
      };

      const { data, error } = await sb
        .from('events')
        .insert([insertData as never])
        .select()
        .single();

      if (error) {
        console.error('Erreur createEvent:', error);
        throw error;
      }

      if (data) {
        setEvents(prev => [...prev, data as Event]);
      }
      notifySuccess('Succès', 'Événement créé avec succès');
      return data as Event | null;
    } catch (err: unknown) {
      console.error('Erreur lors de createEvent:', err);
      notifyError('Erreur', 'Échec de la création de l\'événement');
      throw err;
    }
  };

  const updateEvent = async (id: string, updates: EventUpdateData) => {
    try {
      console.debug('📅 Updating event with data:', updates);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: authData } = await (supabase as any).auth.getUser();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentUser = (authData as any)?.user;
        console.debug('📅 updateEvent executing as user:', currentUser?.id, 'targetEventId:', id);
      } catch (authErr) {
        console.warn('⚠️ Impossible de récupérer l\'utilisateur avant update:', authErr);
      }

      const { data, error } = await sb
        .from('events')
        .update(updates as never)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Erreur updateEvent:', error);
        throw error;
      }
      if (data) {
        setEvents(prev => prev.map(event => (event.id === id ? data as Event : event)));
      } else {
        console.warn('updateEvent: aucune ligne affectée pour id', id);
        throw new Error('Aucune ligne mise à jour — vérifiez les permissions (RLS) ou l\'identifiant');
      }
      notifySuccess('Succès', 'Événement mis à jour avec succès');
      return data as Event | null;
    } catch (err: unknown) {
      console.error('Erreur lors de updateEvent:', err);
      notifyError('Erreur', 'Échec de la mise à jour de l\'événement');
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      console.debug('🗑️ deleteEvent called for id:', id);
      
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: authData } = await (supabase as any).auth.getUser();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentUser = (authData as any)?.user;
        console.debug('🗑️ deleteEvent executing as user:', currentUser?.id);
      } catch (authErr) {
        console.warn('⚠️ Impossible de récupérer l\'utilisateur avant delete:', authErr);
      }

      const { error, count } = await sb
        .from('events')
        .delete()
        .eq('id', id);

      console.debug('🗑️ deleteEvent response:', { error, count });

      if (error) {
        console.error('❌ deleteEvent RLS/query error:', error);
        throw error;
      }

      setEvents(prev => {
        const updated = prev.filter(event => event.id !== id);
        console.debug('🗑️ updateState: removed event id', id, '— remaining events:', updated.length);
        return updated;
      });
      
      notifySuccess('Succès', 'Événement supprimé avec succès');
    } catch (err: unknown) {
      console.error('❌ Erreur lors de deleteEvent:', err);
      notifyError('Erreur', 'Échec de la suppression de l\'événement');
      throw err;
    }
  };

  return { events, loading, error, createEvent, updateEvent, deleteEvent, refreshEvents: fetchEvents };
};
