// src/config/sites/meilleur-ski.ts
import type { SiteConfig } from "../site.types";

export const meilleurSki: SiteConfig = {
  id: "meilleur-ski",
  name: "Meilleur Ski",
  domain: "https://meilleur-ski.com",
  tagline: "Comparer & gagner",

  brand: {
    logoSrc: "/brands/meilleur-ski/logo.svg",
    logoAlt: "Meilleur Ski",
    faviconSrc: "/brands/meilleur-ski/favicon.ico",
  },

  colors: {
    primary: "#0ea5e9",
    secondary: "#111827",
    accent: "#f97316",

    background: "#ffffff",
    foreground: "#0b1220",

    muted: "#f3f4f6",
    mutedForeground: "#6b7280",

    border: "#e5e7eb",
  },

  fonts: {
    sans: "inter",
    display: "manrope",
  },

  home: {
    hero: {
      title: "Le comparateur des passionnés de ski",
      highlight: "comparateur",
      subtitle: "Comparez les prix, consultez les tests et les avis pour trouver le matériel parfait.",
      ctas: [
        { label: "Rechercher un modèle", href: "/search", variant: "primary" },
        { label: "Explorer les catégories", href: "#categories", variant: "outline" },
        { label: "Lire nos guides", href: "/pages", variant: "outline" },
      ],
    },
    sections: {
      categories: true,
      latestGuides: true,
      topBrands: true,
    },
    categoryTiles: [
      {
        slug: "skis-all-mountain",
        title: "Skis All-Mountain",
        desc: "Le meilleur compromis piste / hors-piste pour 80% des skieurs.",
        cta: "Comparer les All-Mountain",
        img: "/categories/skis-all-mountain.jpg",
      },
      {
        slug: "skis-freeride",
        title: "Skis Freeride",
        desc: "Flottaison et stabilité : l’outil parfait quand il a neigé.",
        cta: "Voir les Freeride",
        img: "/categories/skis-freeride.jpg",
      },
      {
        slug: "skis-rando",
        title: "Skis de rando",
        desc: "Léger à la montée, sûr à la descente : optimise ton set-up.",
        cta: "Explorer la rando",
        img: "/categories/skis-rando.jpg",
      },
      {
        slug: "fixations",
        title: "Fixations",
        desc: "Alpine, rando, hybrides : compare les offres et la compatibilité.",
        cta: "Comparer les fixations",
        img: "/categories/fixations.jpg",
      },
      {
        slug: "chaussures",
        title: "Chaussures",
        desc: "Confort et précision : le choix n°1 pour progresser.",
        cta: "Trouver ses chaussures",
        img: "/categories/chaussures.jpg",
      },
	  {
        slug: "/vetements-ski",
        title: "Vêtements de ski",
        desc: "Essentielles pour skier au chaud, au sec et avec liberté.",
        cta: "S’équiper en vêtements de ski",
        img: "/categories//vetements-ski.jpg",
      },
    ],
    topBrands: [
      { name: "Rossignol", slug: "rossignol", logo: "/brands/2026-02-18T21-35-20-364Z-logo-rossignol.svg" },
      { name: "Salomon", slug: "salomon", logo: "/brands/2026-03-09T20-58-37-112Z-logo-salomon.png" },
      { name: "Head", slug: "head", logo: "/brands/2026-03-09T21-26-26-434Z-logo-head.png" },
      { name: "Black Crows", slug: "black-crows", logo: "/brands/2026-03-09T21-35-32-594Z-Logo-black-crows.png" },
      { name: "Atomic", slug: "atomic", logo: "/brands/2026-03-09T21-41-48-373Z-Atomic-Skis-logo.png" },
    ],
  },
};
