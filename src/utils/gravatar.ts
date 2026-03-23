import { md5hex } from '@/utils/md5hex';

/** URL Gravatar (MD5 de l’email en minuscules), taille et fallback identicon. */
export function gravatarUrlFromEmail(email: string, size = 200): string {
  const normalized = email.trim().toLowerCase();
  const hash = md5hex(normalized);
  const params = new URLSearchParams({ s: String(size), d: 'identicon' });
  return `https://www.gravatar.com/avatar/${hash}?${params.toString()}`;
}
