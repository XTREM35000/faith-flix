import { supabase } from '@/integrations/supabase/client';

export interface ParoisseAdminRow {
  id: string;
  nom: string;
  slug: string;
  logo_url: string | null;
  couleur_principale: string | null;
  description: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  site_web: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ParoisseUpsertPayload = {
  id?: string;
  nom: string;
  slug: string;
  logo_url?: string | null;
  couleur_principale?: string | null;
  description?: string | null;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  site_web?: string | null;
  is_active: boolean;
};

/** Liste complète (RLS : super_admin). */
export async function fetchParoissesForAdmin() {
  const { data, error } = await supabase
    .from('paroisses')
    .select('*')
    .order('nom', { ascending: true });

  return { data: (data as ParoisseAdminRow[] | null) ?? null, error };
}

/** Insert ou update selon la présence de `id`. */
export async function upsertParoisse(payload: ParoisseUpsertPayload) {
  const row = {
    nom: payload.nom.trim(),
    slug: payload.slug.trim().toLowerCase(),
    logo_url: payload.logo_url ?? null,
    couleur_principale: payload.couleur_principale?.trim() || '#3b82f6',
    description: payload.description?.trim() || null,
    adresse: payload.adresse?.trim() || null,
    telephone: payload.telephone?.trim() || null,
    email: payload.email?.trim() || null,
    site_web: payload.site_web?.trim() || null,
    is_active: payload.is_active,
  };

  if (payload.id) {
    return supabase.from('paroisses').update(row).eq('id', payload.id).select().single();
  }

  return supabase.from('paroisses').insert([row]).select().single();
}

export async function deleteParoisseById(id: string) {
  return supabase.from('paroisses').delete().eq('id', id);
}

/** Message lisible pour erreur Supabase (ex. slug unique). */
export function formatParoisseSaveError(error: { message?: string; code?: string }): string {
  const msg = error.message || '';
  if (msg.includes('duplicate') || msg.includes('unique') || error.code === '23505') {
    return 'Ce slug est déjà utilisé. Choisissez un autre slug.';
  }
  return msg || 'Erreur lors de la sauvegarde.';
}
