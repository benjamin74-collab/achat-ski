// src/config/site.types.ts

export type FontKey = "inter" | "manrope" | "plusJakarta";

export type BrandTokens = {
  logoSrc: string; // ex: "/brands/meilleur-ski/logo.svg"
  logoAlt: string; // ex: "Meilleur Ski"
  faviconSrc?: string; // ex: "/brands/meilleur-ski/favicon.ico"
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
  sans: FontKey;
  display: FontKey;
};

export type HomeCta = {
  label: string;
  href: string;
  variant?: "primary" | "outline" | "secondary" | "accent";
};

export type HomeTile = {
  slug: string; // slug catégorie utilisé pour "/c/{slug}"
  title: string;
  desc: string;
  cta: string;
  img?: string; // chemin dans /public (ex: "/categories/xxx.jpg")
};

export type HomeBrand = {
  name: string;
  slug: string; // url marque => "/marques/{slug}"
  logo?: string; // url logo externe ou interne
};

export type HomeConfig = {
  hero?: {
    title: string;
    highlight?: string;
    subtitle?: string;
    ctas?: HomeCta[];
  };

  sections?: {
    categories?: boolean;
    latestGuides?: boolean;
    topBrands?: boolean;
  };

  categoryTiles?: HomeTile[];
  topBrands?: HomeBrand[];
};

export type SiteConfig = {
  id: string;
  name: string;
  domain: string;
  tagline?: string;

  brand: BrandTokens;
  colors: ColorTokens;
  fonts: FontTokens;

  // ✅ contenu home spécifique au site
  home?: HomeConfig;
};