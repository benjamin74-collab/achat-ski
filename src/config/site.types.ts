// src/config/site.types.ts

export type FontKey = "inter" | "manrope" | "plusJakarta";

export type BrandTokens = {
  logoSrc: string;
  logoAlt: string;
  faviconSrc?: string;
};

export type ColorTokens = {
  primary: string;
  secondary: string;
  accent: string;

  background: string;
  foreground: string;

  muted: string;
  mutedForeground: string;

  border: string;
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
  slug: string;
  title: string;
  desc: string;
  cta: string;
  img?: string;
};

export type HomeBrand = {
  name: string;
  slug: string;
  logo?: string;
};

export type HomeConfig = {
  hero?: {
    title?: string;
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

  /**
   * Fallback uniquement.
   * Les valeurs réelles proviennent de SiteSettings (backoffice).
   * Ces propriétés restent obligatoires pour éviter
   * les erreurs TypeScript dans toute l'application.
   */
  brand: BrandTokens;
  colors: ColorTokens;
  fonts: FontTokens;

  home?: HomeConfig;
};