// src/config/sites/meilleur-ski.ts
import type { SiteConfig } from "../site.types";

export const meilleurSki: SiteConfig = {
  id: "meilleur-ski",
  name: "Meilleur Ski",
  domain: "https://meilleur-ski.com",

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
};
