export type PublicPagePermission = {
  path: string;
  label: string;
  icon: string;
};

export const PUBLIC_PAGES: PublicPagePermission[] = [
  { path: '/videos', label: 'Videos', icon: '🎬' },
  { path: '/homilies', label: 'Homelies', icon: '📖' },
  { path: '/galerie', label: 'Galerie', icon: '🖼️' },
  { path: '/evenements', label: 'Evenements', icon: '📅' },
  { path: '/announcements', label: 'Annonces', icon: '📢' },
  { path: '/donate', label: 'Dons', icon: '💰' },
  { path: '/directory', label: 'Annuaire', icon: '📞' },
  { path: '/prayers', label: 'Prieres', icon: '🙏' },
  { path: '/radio', label: 'Podcasts / Radio', icon: '🎙️' },
  { path: '/a-propos', label: 'A propos', icon: 'ℹ️' },
  { path: '/help', label: 'Contact / Aide', icon: '✉️' },
];

export function normalizePagePath(path: string): string {
  const p = (path || '/').trim();
  const noHash = p.split('#')[0] ?? p;
  const noQuery = noHash.split('?')[0] ?? noHash;
  const normalized = noQuery.replace(/\/+$/, '') || '/';
  return normalized;
}

const PERMISSION_ROUTE_ALIASES: Record<string, string[]> = {
  '/videos': ['/videos'],
  '/homilies': ['/homilies', '/homelies'],
  '/galerie': ['/galerie', '/gallery'],
  '/evenements': ['/evenements', '/events'],
  '/announcements': ['/announcements'],
  '/donate': ['/donate', '/donations', '/donation-success'],
  '/directory': ['/directory'],
  '/prayers': ['/prayers'],
  '/radio': ['/radio', '/podcasts'],
  '/a-propos': ['/a-propos', '/about'],
  '/help': ['/help', '/contact'],
};

const ROUTE_TO_PERMISSION_KEY = (() => {
  const pairs: Array<{ routePrefix: string; permissionKey: string }> = [];
  Object.entries(PERMISSION_ROUTE_ALIASES).forEach(([permissionKey, aliases]) => {
    aliases.forEach((routePrefix) => {
      pairs.push({
        routePrefix: normalizePagePath(routePrefix),
        permissionKey: normalizePagePath(permissionKey),
      });
    });
  });
  // Prefer longest prefix first (eg. /events/:id over /events)
  pairs.sort((a, b) => b.routePrefix.length - a.routePrefix.length);
  return pairs;
})();

export function resolvePermissionKeyForPath(path: string): string | null {
  const normalized = normalizePagePath(path);
  for (const pair of ROUTE_TO_PERMISSION_KEY) {
    if (normalized === pair.routePrefix || normalized.startsWith(`${pair.routePrefix}/`)) {
      return pair.permissionKey;
    }
  }
  return null;
}
