import { supabase } from '@/integrations/supabase/client';

export type BackupRow = {
  id: string;
  name: string | null;
  description: string | null;
  data: unknown;
  size: number | null;
  created_at: string;
  created_by: string | null;
  type?: string | null;
};

/**
 * Récupère les sauvegardes triées par date décroissante.
 * Si `type` est fourni, filtre sur ce type (ex: 'full').
 */
export const fetchBackups = async (type?: string | null) => {
  try {
    const q = supabase.from('backups').select('*').order('created_at', { ascending: false });
    // Note: supabase query builder doesn't allow conditional where easily here,
    // so we call .eq when type is provided
    const finalQ = type ? (q as any).eq('type', type) : q;
    const { data, error } = await finalQ;
    if (error) throw error;
    return (data as BackupRow[]) || [];
  } catch (err) {
    console.error('backupQueries.fetchBackups error', err);
    throw err;
  }
};

/**
 * Supprime une sauvegarde sauf si elle est la plus récente.
 * Retourne true si suppression effectuée, false si empêchée.
 */
export const deleteBackup = async (id: string) => {
  try {
    // récupérer la dernière sauvegarde
    const { data: latestData, error: latestError } = await supabase
      .from('backups')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) throw latestError;
    const latestId = (latestData as any)?.id as string | undefined;
    if (latestId && latestId === id) {
      return { deleted: false, reason: 'latest' };
    }

    const { error } = await supabase.from('backups').delete().eq('id', id);
    if (error) throw error;
    return { deleted: true };
  } catch (err) {
    console.error('backupQueries.deleteBackup error', err);
    throw err;
  }
};
