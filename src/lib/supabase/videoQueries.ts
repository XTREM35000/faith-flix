import { supabase } from '@/integrations/supabase/client';
import type { Video } from '@/types/database';

// =====================================================
// VIDEO QUERIES - CRUD OPERATIONS
// Contournement des types Supabase : utiliser 'as any'
// =====================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const videosTable = 'videos' as any;

export async function fetchVideos(options?: {
  limit?: number;
  offset?: number;
  search?: string;
}) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from(videosTable) as any)
      .select('*', { count: 'exact' });

    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    const { data, error, count } = await query;
    if (error) {
      console.error('❌ fetchVideos error:', error.code, error.message);
      throw error;
    }

    const recordCount = data?.length || 0;
    const validData = (data || []).filter((video: unknown): video is Video => {
      if (!video || typeof video !== 'object') return false;
      const v = video as Partial<Video>;
      return typeof v.id === 'string' && typeof v.title === 'string';
    });

    console.log(`🎥 Videos Query: ${recordCount} records → ${validData.length} valides`);

    return { data: validData, count };
  } catch (e) {
    console.error('❌ fetchVideos unexpected error:', e);
    return null;
  }
}

export async function fetchVideoById(id: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(videosTable) as any)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('fetchVideoById error', error);
      return null;
    }

    return (data as Video) || null;
  } catch (e) {
    console.error('fetchVideoById unexpected error', e);
    return null;
  }
}

export async function createVideo(video: Partial<Video>) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(videosTable) as any)
      .insert([video])
      .select()
      .single();
    if (error) {
      console.error('createVideo error', error);
      return null;
    }
    return (data as Video) || null;
  } catch (e) {
    console.error('createVideo unexpected error', e);
    return null;
  }
}

export async function updateVideo(id: string, updates: Partial<Video>) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from(videosTable) as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('updateVideo error', error);
      return null;
    }
    return (data as Video) || null;
  } catch (e) {
    console.error('updateVideo unexpected error', e);
    return null;
  }
}

export async function deleteVideo(id: string) {
  try {
    console.debug('🗑️ deleteVideo START for id:', id);
    
    const { error, count } = await (supabase.from(videosTable) as unknown as { delete: () => { eq: (field: string, value: string) => Promise<{ error: Error | null, count: number | null }> } })
      .delete()
      .eq('id', id);
    
    console.debug('🗑️ deleteVideo response:', { error, count });
    
    if (error) {
      console.error('❌ deleteVideo error:', error);
      return false;
    }
    
    console.debug('✅ deleteVideo success:', { count, id });
    return true;
  } catch (e) {
    console.error('❌ deleteVideo unexpected error:', e);
    return false;
  }
}

export async function incrementVideoViews(id: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: readData, error: readErr } = await (supabase.from(videosTable) as any)
      .select('views')
      .eq('id', id)
      .maybeSingle();

    if (readErr || !readData) {
      console.error('incrementVideoViews read error', readErr);
      return null;
    }

    const current = (readData as { views?: number } | null)?.views ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updData, error: updErr } = await (supabase.from(videosTable) as any)
      .update({ views: current + 1 })
      .eq('id', id)
      .select('views')
      .single();

    if (updErr) {
      console.error('incrementVideoViews update error', updErr);
      return null;
    }
    return updData as { views: number } | null;
  } catch (e) {
    console.error('incrementVideoViews unexpected error', e);
    return null;
  }
}
