import { useCallback, useMemo } from 'react';

export const OFFICIANT_TITLES = [
  {
    title: 'Pape',
    description:
      "Chef spirituel et politique de l'Église catholique, vicaire du Christ sur terre. Réside au Vatican.",
  },
  {
    title: 'Cardinal',
    description:
      "Conseiller du pape, membre du collège des cardinaux. Responsable d'élire les nouveaux papes.",
  },
  {
    title: 'Archevêque',
    description: "Évêque responsable d'une province ecclésiastique et des diocèses suffragants.",
  },
  {
    title: 'Évêque Diocésain',
    description: 'Premier enseignant et berger du peuple de Dieu. Guide spirituellement son diocèse.',
  },
  {
    title: 'Évêque Auxiliaire',
    description: "Assiste l'évêque diocésain dans les grands diocèses.",
  },
  { title: 'Curé', description: "Prêtre placé à la tête d'une paroisse." },
  {
    title: 'Vicaire',
    description: 'Collaborateur du curé dans une paroisse (du latin vicarius : suppléant).',
  },
  {
    title: 'Diacre',
    description:
      "Troisième degré de l'ordre. Assistant de l'évêque et du prêtre. Diaconat permanent restauré en 1964.",
  },
  {
    title: 'Abbé',
    description: "Supérieur d'un monastère d'hommes (abbaye). Titre aussi donné à un prêtre séculier.",
  },
] as const;

export type OfficiantTitle = (typeof OFFICIANT_TITLES)[number];

export function getOfficiantTitleDescription(title: string): string | null {
  const found = OFFICIANT_TITLES.find((t) => t.title === title);
  return found?.description ?? null;
}

/** Ne plus insérer de lignes dans `officiants` pour les titres : le catalogue OFFICIANT_TITLES suffit pour les listes déroulantes. */
export async function ensureOfficiantTitles(_paroisseId: string | null): Promise<void> {
  return;
}

export const useOfficiantTitles = (paroisseId: string | null) => {
  const titles = useMemo(() => OFFICIANT_TITLES.map((t) => t.title), []);

  const ensureTitles = useCallback(async () => {
    await ensureOfficiantTitles(paroisseId);
  }, [paroisseId]);

  return { ensureTitles, titles, titleObjects: OFFICIANT_TITLES };
};

