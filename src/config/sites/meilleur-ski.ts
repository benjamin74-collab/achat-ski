// src/config/sites/meilleur-ski.ts
import type { SiteConfig } from "../site.types";

export const meilleurSki: SiteConfig = {
  id: "meilleur-ski",
  name: "Meilleur Ski",
  domain: "https://www.meilleur-ski.com",
  tagline: "Comparer & gagner",

  // Fallback minimal uniquement.
  // Le logo, les couleurs, les polices, les catégories,
  // les marques et le contenu home doivent venir du backoffice.
  brand: {
    logoSrc: "/brands/meilleur-ski/logo-meilleur-ski.png",
    logoAlt: "Meilleur Ski",
    faviconSrc: "/brands/meilleur-ski/favicon.ico",
  },
};