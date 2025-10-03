// tailwind.config.ts
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
      colors: {
        ink: "#0B1020",
        muted: "#EEF0F6",
        brand: {
          DEFAULT: "#6E68FF",
          50: "#F0EFFF",
          100: "#E1E0FF",
          200: "#C2C0FF",
          300: "#A3A0FF",
          400: "#847FFF",
          500: "#6E68FF",
          600: "#514BDB",
          700: "#3934B1",
          800: "#262282",
          900: "#161553",
        },
        accent: "#00D2A8",
        "accent-2": "#FF7A59",
        card: "#FFFFFF",
        ring: "#DCE1EE",
      },
      boxShadow: {
        card: "0 8px 24px rgba(11,16,32,0.06)",
        ring: "0 0 0 2px var(--ring)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
    },
  },
  plugins: [typography],
};
export default config;
