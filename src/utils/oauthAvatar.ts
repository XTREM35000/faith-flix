/**
 * URL d’avatar depuis user_metadata OAuth (Google : `picture`, Facebook / autres : `avatar_url`).
 */
export function oauthAvatarFromMetadata(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const pick = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  return pick(metadata.avatar_url) ?? pick(metadata.picture) ?? null;
}
