// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        /**
         * ✅ Couleurs sémantiques multi-sites (via variables injectées dans <html>)
         * - On évite "accent" car tu as déjà une palette "accent" (50..900)
         */
        primary: "rgb(var(--primary) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        siteAccent: "rgb(var(--accent) / <alpha-value>)",

        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        mutedForeground: "rgb(var(--muted-foreground) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",

        // ✅ Palette principale (flashy)
        brand: {
          50: "#fff3e6",
          100: "#ffe3c7",
          200: "#ffc78f",
          300: "#ffa85a",
          400: "#ff8e2e",
          500: "#ff6a00", // primaire
          600: "#e55f00",
          700: "#b74b00",
          800: "#8a3900",
          900: "#552200",
        },

        // ✅ Bleu accent (palette existante)
        accent: {
          50: "#e6f7ff",
          100: "#cceeff",
          200: "#99ddff",
          300: "#66ccff",
          400: "#33baff",
          500: "#00a4ff",
          600: "#0088d1",
          700: "#006aa2",
          800: "#004c73",
          900: "#00334d",
        },

        // ✅ Vert accent (palette existante)
        leaf: {
          50: "#e9fbf1",
          100: "#c7f5dc",
          200: "#92eac0",
          300: "#58dea0",
          400: "#2dce84",
          500: "#13b06b",
          600: "#0c945a",
          700: "#087349",
          800: "#06573a",
          900: "#043d2a",
        },

        /**
         * Tokens legacy (utilisés par ton globals.css actuel)
         * On les garde pour ne rien casser.
         */
        bg: "#ffffff",
        surface: "#f8fafc",
        ring: "#e2e8f0",
        text: "#0f172a",
        ink: "#0d1229",
      },
      boxShadow: {
        card: "0 6px 24px rgba(13, 18, 41, 0.06)",
        brand: "0 6px 20px rgba(255, 106, 0, 0.35)",
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
