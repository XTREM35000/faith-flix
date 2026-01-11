import { useMemo } from 'react';
import type { LexiqueTerm } from '../types';

export function useLexiqueSearch(terms: LexiqueTerm[], searchQuery: string, activeCategory: string | null) {
  return useMemo(() => {
    let filtered = terms;

    // Filtrer par catégorie
    if (activeCategory) {
      filtered = filtered.filter(term => term.category === activeCategory);
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        term =>
          term.term.toLowerCase().includes(query) ||
          term.synonyms.some(syn => syn.toLowerCase().includes(query)) ||
          term.definition.what.toLowerCase().includes(query) ||
          term.definition.location.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [terms, searchQuery, activeCategory]);
}
