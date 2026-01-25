// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // ✅ Couleurs sémantiques (multi-sites)
        primary: "rgb(var(--primary) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",

        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        mutedForeground: "rgb(var(--muted-foreground) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",

        // ✅ On garde tes palettes existantes (elles seront “alimentées” via globals.css)
        brand: {
          50: "var(--color-brand-50)",
          100: "var(--color-brand-100)",
          200: "var(--color-brand-200)",
          300: "var(--color-brand-300)",
          400: "var(--color-brand-400)",
          500: "var(--color-brand-500)",
          600: "var(--color-brand-600)",
          700: "var(--color-brand-700)",
          800: "var(--color-brand-800)",
          900: "var(--color-brand-900)",
        },
        accent: {
          50: "var(--color-accent-50)",
          100: "var(--color-accent-100)",
          200: "var(--color-accent-200)",
          300: "var(--color-accent-300)",
          400: "var(--color-accent-400)",
          500: "var(--color-accent-500)",
          600: "var(--color-accent-600)",
          700: "var(--color-accent-700)",
          800: "var(--color-accent-800)",
          900: "var(--color-accent-900)",
        },
        // “sec” n’existe pas en tailwind config chez toi mais est utilisé dans globals.css
        sec: {
          50: "var(--color-sec-50)",
          100: "var(--color-sec-100)",
          200: "var(--color-sec-200)",
          300: "var(--color-sec-300)",
          400: "var(--color-sec-400)",
          500: "var(--color-sec-500)",
          600: "var(--color-sec-600)",
          700: "var(--color-sec-700)",
          800: "var(--color-sec-800)",
          900: "var(--color-sec-900)",
        },

        // Tokens legacy (compat)
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        ring: "var(--color-ring)",
        text: "var(--color-text)",
        ink: "var(--color-ink)",
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
