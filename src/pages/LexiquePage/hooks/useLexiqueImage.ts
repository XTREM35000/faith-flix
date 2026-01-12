import { useMemo } from 'react';

/**
 * Hook pour gérer le chargement des images du lexique
 * NOTE: Suppression de la vérification HEAD coûteuse (causait 100+ requêtes réseau en parallèle)
 * Les images sont maintenant gérées par le tag <img> qui gère lui-même le fallback
 */
export function useLexiqueImage(category: string, termId: string) {
  const imagePath = useMemo(() => `/images/lexique/${category}/${termId}.png`, [category, termId]);

  return {
    imagePath,
    imageExists: true, // Toujours true : le tag img gère les erreurs
    isLoading: false,  // Pas de vérification préalable
  };
}

/**
 * Retourne la couleur de catégorie pour le placeholder
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    interface: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
    navigation: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20',
    content: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
    actions: 'from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20',
    admin: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
  };
  return colors[category] || 'from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20';
}
