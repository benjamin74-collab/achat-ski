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
        brand: {
          50:  "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#ff6a00",   // 🟠 Orange punchy
          600: "#e85d00",
          700: "#c44d00",
          800: "#9a3d00",
          900: "#7a3100",
        },
        accent: {
          500: "#00c2ff",   // 🔵 Cyan flashy
          600: "#00a7db",
        },
        leaf: {
          500: "#2ecc71",   // 🟢 Vert
          600: "#29b665",
        },

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
        xl: "14px",
        "2xl": "18px",
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
