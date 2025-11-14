// src/config/ads.ts

/**
 * Configuration d’un emplacement pub.
 * Tu pourras l’enrichir plus tard (provider, targeting, etc.)
 */
export type AdConfig = {
  provider: "adsense" | "gam" | "custom";
  slotId: string;
  sizes?: [number, number][]; // ex: [[300,250], [336,280]]
};

/**
 * Dictionnaire des emplacements pubs du site.
 *
 * - Si la valeur est `null` → pas de pub rendue (le composant AdSlot ne s’affiche pas).
 * - Si tu définis un objet { provider, slotId, ... } → AdSlot pourra afficher le script associé.
 */
export const AD_CONFIG: Record<string, AdConfig | null> = {
  page_top: null,
  page_sidebar: null,
  page_inline: null,
  page_bottom: null,
};
