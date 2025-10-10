import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ✅ Couleurs utilisées par tes classes utilitaires
        bg: "#0d1229",           // fond global foncé
        surface: "#12193a",      // cartes/surfaces
        ring: "#2b3a6b",         // bordures & focus rings
        ink: "#ffffff",          // texte sur fond foncé

        // ✅ Palette “brand” (plus flashy ; tu peux ajuster)
        brand: {
          50:  "#eef7ff",
          100: "#d9edff",
          200: "#b3dcff",
          300: "#85c4ff",
          400: "#4fa6ff",
          500: "#1c8fff",
          600: "#0074e6",
          700: "#005cbc",
          800: "#004b98",
          900: "#003a73",
        },

        // ✅ Accents secondaires possibles (vert/orange pour badges/prix)
        lime:  { 500: "#5ee05e" },
        amber: { 500: "#ffb020" },
        rose:  { 500: "#ff3b6b" },
		
        // Sémantique UI
        bg:       "#ffffff",
        surface:  "#f8fafc", // gris très léger pour cartes
        ring:     "#e2e8f0",
        text:     "#0f172a",
        subtle:   "#64748b",
      },

      boxShadow: {
        card: "0 6px 24px -10px rgba(16, 24, 40, 0.18)",
        brand: "0 8px 30px -6px rgba(255,106,0,0.45)",
      },

      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem",
      },

      backgroundImage: {
        // Halo coloré doux pour le header/hero
        "brand-blob":
          "radial-gradient(1200px 600px at 20% -10%, rgba(255,106,0,.16), transparent 60%), radial-gradient(1000px 500px at 80% -20%, rgba(0,194,255,.18), transparent 60%)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
