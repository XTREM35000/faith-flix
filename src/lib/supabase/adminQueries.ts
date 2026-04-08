// This file is no longer used - see videoQueries.ts and commentQueries.ts instead
// Keeping for backwards compatibility but deprecated

import { 
  fetchVideos, 
  updateVideo, 
  deleteVideo 
} from './videoQueries';

import { 
  fetchRecentComments, 
  moderateComment, 
  deleteComment 
} from './commentQueries';
import { supabase } from '@/integrations/supabase/client';

export { 
  fetchVideos, 
  updateVideo, 
  deleteVideo,
  fetchRecentComments,
  moderateComment,
  deleteComment,
};

export async function fetchRolePagePermissions(roleName: string): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('role_page_permissions')
    .select('page_path')
    .eq('role_name', roleName);
  if (error) throw error;
  return ((data ?? []) as Array<{ page_path?: string | null }>)
    .map((r) => String(r.page_path ?? '').trim())
    .filter(Boolean);
}

export async function upsertRolePagePermission(roleName: string, pagePath: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('role_page_permissions')
    .upsert({ role_name: roleName, page_path: pagePath }, { onConflict: 'role_name,page_path' });
  if (error) throw error;
}

export async function deleteRolePagePermission(roleName: string, pagePath: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('role_page_permissions')
    .delete()
    .eq('role_name', roleName)
    .eq('page_path', pagePath);
  if (error) throw error;
}

// Paroisses (administration multi-paroisses, super_admin / RLS)
export {
  fetchParoissesForAdmin,
  upsertParoisse,
  deleteParoisseById,
  formatParoisseSaveError,
  type ParoisseAdminRow,
  type ParoisseUpsertPayload,
} from './paroisseAdminQueries';
