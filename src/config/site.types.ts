// src/config/site.types.ts

export type FontKey = "inter" | "manrope" | "plusJakarta";

export type BrandTokens = {
  logoSrc: string; // ex: "/brands/meilleur-ski/logo.svg"
  logoAlt: string; // ex: "Meilleur Ski"
  faviconSrc?: string; // ex: "/brands/meilleur-ski/favicon.ico" (optionnel)
};

export type ColorTokens = {
  primary: string; // ex: "#0ea5e9"
  secondary: string; // ex: "#111827"
  accent: string; // ex: "#f97316"

  background: string; // ex: "#ffffff"
  foreground: string; // ex: "#0b1220"

  muted: string; // ex: "#f3f4f6"
  mutedForeground: string; // ex: "#6b7280"

  border: string; // ex: "#e5e7eb"
};

export type FontTokens = {
  sans: FontKey; // font principale (texte)
  display: FontKey; // font “titres”
};

export type HomeCta = {
  label: string;
  href: string;
  variant?: "primary" | "outline" | "secondary" | "accent";
};

export type HomeTile = {
  slug: string; // url interne => "/{slug}"
  title: string;
  desc: string;
  cta: string;
  img?: string; // chemin dans /public (ex: "/categories/xxx.jpg")
};

export type HomeBrand = {
  name: string;
  slug: string; // url interne => "/marques/{slug}" (ou autre selon ton site)
  logo?: string; // url logo externe ou interne
};

export type HomeConfig = {
  hero?: {
    title: string;
    highlight?: string; // mot/segment à surligner (optionnel)
    subtitle?: string;
    ctas?: HomeCta[];
  };

  sections?: {
    // Permet de rendre les sites VRAIMENT différents sans dupliquer le code
    categories?: boolean;
    latestGuides?: boolean;
    topBrands?: boolean;
  };

  categoryTiles?: HomeTile[];
  topBrands?: HomeBrand[];
};

export type SiteConfig = {
  id: string; // ex: "meilleur-ski"
  name: string; // ex: "Meilleur Ski"
  domain: string; // ex: "https://meilleur-ski.com"

  tagline?: string; // ex: "Comparer & gagner"

  brand: BrandTokens;
  colors: ColorTokens;
  fonts: FontTokens;

  // ✅ Contenu home spécifique au site
  home?: HomeConfig;
};
