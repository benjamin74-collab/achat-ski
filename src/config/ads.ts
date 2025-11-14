// src/config/ads.ts

/**
 * Configuration d’un emplacement pub.
 * Champs optionnels pour que tu puisses commencer simple,
 * puis brancher un vrai provider plus tard.
 */
export type AdConfig = {
  // Pour de la pub “classique” (ex: AdSense, GAM)
  provider?: "adsense" | "gam" | "custom";
  slotId?: string;
  sizes?: [number, number][];

  // Pour les encarts “maison” (image + lien)
  imageUrl?: string;
  linkUrl?: string;
  label?: string;
};

/**
 * Dictionnaire des emplacements pubs du site.
 *
 * - null  => aucun affichage (le composant ne rend rien)
 * - objet => l’encart est visible (si les champs nécessaires sont remplis)
 */
export const AD_CONFIG: Record<string, AdConfig | null> = {
  page_top: null,
  page_sidebar: null,
  page_inline: null,
  page_bottom: null,
};
