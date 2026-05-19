// src/config/sites/meilleur-robot.ts
import type { SiteConfig } from "../site.types";

export const meilleurRobot: SiteConfig = {
  id: "meilleur-robot",
  name: "Meilleur Robot",
  domain: "https://www.meilleur-robot.com",
  tagline: "Comparer, choisir, automatiser",

  brand: {
    logoSrc: "/brands/meilleur-robot/logo.svg",
    logoAlt: "Meilleur Robot",
    faviconSrc: "/brands/meilleur-robot/favicon.ico",
  },

  colors: {
    primary: "#22c55e",
    secondary: "#0f172a",
    accent: "#a855f7",

    background: "#ffffff",
    foreground: "#0b1220",

    muted: "#f1f5f9",
    mutedForeground: "#64748b",

    border: "#e2e8f0",
  },

  fonts: {
    sans: "inter",
    display: "plusJakarta",
  },

  home: {
    hero: {
      title: "Le comparateur de robots pour gagner du temps",
      highlight: "robots",
      subtitle:
        "Aspirateurs, tondeuses, cuisine, nettoyage : comparez les meilleurs modèles, leurs fonctionnalités et les prix.",
      ctas: [
        { label: "Rechercher un robot", href: "/search", variant: "primary" },
        { label: "Voir les catégories", href: "#categories", variant: "outline" },
      ],
    },
    sections: {
      categories: true,
      latestGuides: false, // ✅ différent du ski
      topBrands: false, // ✅ différent du ski
    },
    categoryTiles: [
      {
        slug: "robots-aspirateurs",
        title: "Robots aspirateurs",
        desc: "Navigation, puissance, serpillières : trouve le meilleur rapport qualité/prix.",
        cta: "Comparer les aspirateurs",
        img: "/categories/robots-aspirateurs.jpg",
      },
      {
        slug: "robots-tondeuses",
        title: "Robots tondeuses",
        desc: "Surface, pente, fil périphérique ou GPS : choisis le bon modèle.",
        cta: "Comparer les tondeuses",
        img: "/categories/robots-tondeuses.jpg",
      },
      {
        slug: "robots-cuisine",
        title: "Robots de cuisine",
        desc: "Cuisson, programmes, capacité : les modèles qui changent la vie.",
        cta: "Comparer les robots cuisine",
        img: "/categories/robots-cuisine.jpg",
      },
      {
        slug: "robots-lave-vitres",
        title: "Robots lave-vitres",
        desc: "Sécurité, efficacité, compatibilité surfaces : finis les corvées.",
        cta: "Comparer les lave-vitres",
        img: "/categories/robots-lave-vitres.jpg",
      },
      {
        slug: "robots-piscine",
        title: "Robots de piscine",
        desc: "Fond, parois, ligne d’eau : filtration et cycles adaptés à ton bassin.",
        cta: "Comparer les robots piscine",
        img: "/categories/robots-piscine.jpg",
      },
    ],
  },
};
