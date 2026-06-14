// src/config/sites/meilleur-robot.ts

import type { SiteConfig } from "../site.types";

export const meilleurRobot: SiteConfig = {
  id: "meilleur-robot",
  name: "Meilleur Robot",
  domain: "https://www.meilleur-robot.com",
  tagline: "Comparer & gagner",

  // Fallback uniquement.
  // Toutes les données (logo, favicon, couleurs,
  // homepage, catégories, marques, SEO...)
  // sont gérées depuis le backoffice.

  brand: {
    logoSrc: "/brands/meilleur-robot/logo-meilleur-robot.png",
    logoAlt: "Meilleur Robot",
    faviconSrc: "/brands/meilleur-robot/favicon.ico",
  },
};