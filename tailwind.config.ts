import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Nuit bleutée + fluo
        ink: "#0A0E1F",
        bg: "#0D1229",
        brand: {
          50: "#EEF1FF",
          100: "#DCE2FF",
          200: "#B8C3FF",
          300: "#94A5FF",
          400: "#7086FF",
          500: "#4F7DFF",   // bleu électrique (plus flashy que consobaby)
          600: "#3E65E0",
          700: "#2F4EC0",
          800: "#22399C",
          900: "#1A2C7A",
        },
        accent: {
          500: "#00E5C2",   // vert/menthe néon
          600: "#00C3A6",
        },
        rose: {
          500: "#FF5EA8",   // touche rose fluo
        },
        surface: "#111736",
        card: "#121938",
        ring: "#23306B",
      },
      boxShadow: {
        card: "0 12px 28px rgba(0,0,0,0.25)",
        glow: "0 0 0 3px rgba(79,125,255,0.35)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(1200px 600px at 10% -20%, rgba(79,125,255,0.25), transparent), radial-gradient(1000px 600px at 100% -10%, rgba(0,229,194,0.2), transparent)",
      },
    },
  },
  plugins: [typography],
};
export default config;
