// src/config/sites/meilleur-robot.ts

import type { SiteConfig } from "../site.types";

export const meilleurRobot: SiteConfig = {
  id: "meilleur-robot",
  name: "Meilleur Robot",
  domain: "https://www.meilleur-robot.com",
  tagline: "Comparer & gagner",

  brand: {
    logoSrc: "",
    logoAlt: "Meilleur Robot",
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