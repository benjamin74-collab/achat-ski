// src/config/sites/meilleur-robot.ts
import type { SiteConfig } from "../site.types";

export const meilleurRobot: SiteConfig = {
  id: "meilleur-robot",
  name: "Meilleur Robot",
  domain: "https://meilleur-robot.com",

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
};
