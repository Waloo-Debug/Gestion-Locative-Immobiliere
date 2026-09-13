export const TERM_DEFINITIONS = {
  pno: "Assurance Propriétaire Non Occupant : couvre les risques du logement loué (incendie, dégâts des eaux, responsabilité civile, etc.) lorsque le propriétaire n’habite pas le bien.",
  cfe: "Cotisation Foncière des Entreprises : taxe locale qui peut s’appliquer à certaines locations meublées ou activités professionnelles (ex. LMNP), selon la situation fiscale du bien.",
} as const;

export type TermKey = keyof typeof TERM_DEFINITIONS;
