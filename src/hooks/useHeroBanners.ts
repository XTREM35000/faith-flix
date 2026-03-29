import type { QueryClient } from '@tanstack/react-query';

/** Invalide toutes les requêtes `usePageHero` / bannières par route. */
export function invalidateAllPageHeroBanners(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: ['page-hero'] });
}
