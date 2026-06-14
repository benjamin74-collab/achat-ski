// src/config/sites/meilleur-ski.ts

import type { SiteConfig } from "../site.types";

export const meilleurSki: SiteConfig = {
  id: "meilleur-ski",
  name: "Meilleur Ski",
  domain: "https://www.meilleur-ski.com",
  tagline: "Comparer & gagner",

  brand: {
    logoSrc: "",
    logoAlt: "Meilleur Ski",
    faviconSrc: "",
  },

  colors: {
    primary: "",
    secondary: "",
    accent: "",
    background: "",
    foreground: "",
    muted: "",
    mutedForeground: "",
    border: "",
  },

  fonts: {
    sans: "inter",
    display: "inter",
  },

  home: {
    sections: {
      categories: true,
      latestGuides: true,
      topBrands: true,
    },
  },
};