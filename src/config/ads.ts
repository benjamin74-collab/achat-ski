// src/config/ads.ts

/**
 * Configuration d’un emplacement pub.
 * Tout est optionnel pour te laisser brancher
 * soit une créa maison (image + lien + label),
 * soit un bloc HTML, soit un provider type AdSense/GAM.
 */
export type AdConfig = {
  // Provider externe éventuel
  provider?: "adsense" | "gam" | "custom";
  slotId?: string;
  sizes?: [number, number][];

  // Créa simple maison (image + lien)
  imageUrl?: string;
  linkUrl?: string;
  label?: string;

  // Bloc HTML brut (script / iframe fourni par un régie)
  html?: string;
};

/**
 * Dictionnaire des emplacements pubs du site.
 *
 * - null  => aucun affichage (le composant ne rend rien)
 * - objet => l’encart est potentiellement affichable
 */
export const AD_CONFIG: Record<string, AdConfig | null> = {
  page_top: null,
  page_sidebar: null,
  page_inline: null,
  page_bottom: null,
};
