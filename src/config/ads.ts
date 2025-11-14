// src/config/ads.ts
export type AdSlotConfig = {
  imageUrl?: string;
  linkUrl?: string;
  label?: string;
  html?: string; // au cas où tu veuilles coller un script / iframe
};

export const AD_CONFIG: Record<string, AdConfig | null> = {
  page_top: null,
  page_sidebar: null,
  page_inline: null,
  page_bottom: null,
};
