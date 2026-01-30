// src/config/fonts.ts
import { Inter, Manrope, Plus_Jakarta_Sans } from "next/font/google";
import type { FontKey } from "./site.types";

// ✅ Variables distinctes (important : ne jamais utiliser --font-sans ici)
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plusjakarta",
});

/**
 * Classes à appliquer sur <html> pour activer les variables next/font.
 * Inter toujours inclus (fallback “safe”).
 */
export function getFontClasses(keys: FontKey[]): string {
  const set = new Set(keys);
  const classes: string[] = [inter.variable];

  if (set.has("manrope")) classes.push(manrope.variable);
  if (set.has("plusJakarta")) classes.push(plusJakarta.variable);

  return classes.join(" ");
}

/**
 * Map FontKey -> font-family stack basé sur les variables next/font.
 * Utilise Inter comme fallback.
 */
export function getFontFamilyVar(key: FontKey): string {
  switch (key) {
    case "manrope":
      return "var(--font-manrope), var(--font-inter), ui-sans-serif, system-ui";
    case "plusJakarta":
      return "var(--font-plusjakarta), var(--font-inter), ui-sans-serif, system-ui";
    case "inter":
    default:
      return "var(--font-inter), ui-sans-serif, system-ui";
  }
}
