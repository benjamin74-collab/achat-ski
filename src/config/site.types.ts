// src/config/site.types.ts

export type FontKey = "inter" | "manrope" | "plusJakarta";

export type BrandTokens = {
  logoSrc: string;       // ex: "/brands/meilleur-ski/logo.svg"
  logoAlt: string;       // ex: "Meilleur Ski"
  faviconSrc?: string;   // ex: "/brands/meilleur-ski/favicon.ico" (optionnel)
};

export type ColorTokens = {
  // Couleurs “design system” (tu peux en ajouter ensuite)
  primary: string;      // ex: "#0ea5e9"
  secondary: string;    // ex: "#111827"
  accent: string;       // ex: "#f97316"

  background: string;   // ex: "#ffffff"
  foreground: string;   // ex: "#0b1220"

  muted: string;        // ex: "#f3f4f6"
  mutedForeground: string; // ex: "#6b7280"

  border: string;       // ex: "#e5e7eb"
};

export type FontTokens = {
  sans: FontKey;     // font principale (texte)
  display: FontKey;  // font “titres”
};

export type SiteConfig = {
  id: string;           // ex: "meilleur-ski"
  name: string;         // ex: "Meilleur Ski"
  domain: string;       // ex: "https://meilleur-ski.com"

  brand: BrandTokens;
  colors: ColorTokens;
  fonts: FontTokens;
};
