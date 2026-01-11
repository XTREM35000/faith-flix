/**
 * Types pour le Lexique du Site Paroissial
 */

export type LexiqueCategory = 'interface' | 'navigation' | 'content' | 'actions' | 'admin';

export interface LexiqueCategoryMetadata {
  id: LexiqueCategory;
  name: string;
  icon: string;
  description: string;
  color: string; // Tailwind color class
}

export interface AnnotationMarker {
  x: string; // Position X (px ou %)
  y: string; // Position Y (px ou %)
  text: string;
  type: 'primary' | 'secondary';
}

export interface LexiqueScreenshot {
  path: string; // Chemin vers l'image
  alt: string;
  annotations: AnnotationMarker[];
}

export interface LexiqueUsage {
  admin?: string; // Instructions pour les administrateurs
  user?: string; // Instructions pour les visiteurs
  both?: string; // Instructions communes
}

export interface LexiqueTerm {
  id: string;
  term: string; // Terme français principal
  synonyms: string[]; // Autres noms possibles
  category: LexiqueCategory;
  icon: string; // Emoji ou nom d'icône lucide-react
  definition: {
    what: string; // Description simple: "Qu'est-ce que c'est?"
    purpose: string[]; // À quoi ça sert? (liste à puces)
    location: string; // Où le trouver?
    usage: LexiqueUsage; // Comment l'utiliser?
  };
  screenshot?: LexiqueScreenshot; // Capture optionnelle
  relatedTerms: string[]; // IDs des termes liés
  difficulty?: 'beginner' | 'intermediate' | 'advanced'; // Niveau de complexité
}


