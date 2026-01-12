import { useState, useEffect } from 'react';

/**
 * Hook pour gérer le chargement et la vérification des images du lexique
 */
export function useLexiqueImage(category: string, termId: string) {
  const [imageExists, setImageExists] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const imagePath = `/images/lexique/${category}/${termId}.png`;

  useEffect(() => {
    const checkImageExists = async () => {
      setIsLoading(true);
      try {
        // Méthode HEAD pour vérifier l'existence sans charger l'image entièrement
        const response = await fetch(imagePath, { method: 'HEAD' });
        setImageExists(response.ok);
      } catch (error) {
        // En cas d'erreur (CORS, 404, etc.), on tente une méthode alternative
        const img = new Image();
        img.onload = () => {
          setImageExists(true);
        };
        img.onerror = () => {
          setImageExists(false);
        };
        img.src = imagePath;
      } finally {
        setIsLoading(false);
      }
    };

    checkImageExists();
  }, [category, termId, imagePath]);

  return {
    imagePath,
    imageExists,
    isLoading,
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
