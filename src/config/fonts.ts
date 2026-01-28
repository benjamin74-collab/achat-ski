// src/config/fonts.ts
import { Inter, Manrope, Plus_Jakarta_Sans } from "next/font/google";
import type { FontKey } from "./site.types";

// ✅ Pool limité = perf stable
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
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
 * Retourne les classes à appliquer sur <html> ou <body>
 * pour activer les variables CSS des fonts.
 */
export function getFontClasses(keys: FontKey[]): string {
  const set = new Set(keys);
  const classes: string[] = [inter.variable]; // on garde Inter toujours dispo

  if (set.has("manrope")) classes.push(manrope.variable);
  if (set.has("plusJakarta")) classes.push(plusJakarta.variable);

  return classes.join(" ");
}

/**
 * Map FontKey -> CSS font-family (via variables next/font)
 * On utilise Inter comme fallback sûr.
 */
export function getFontFamilyVar(key: FontKey): string {
  switch (key) {
    case "manrope":
      return "var(--font-manrope), var(--font-sans), ui-sans-serif, system-ui";
    case "plusJakarta":
      return "var(--font-plusjakarta), var(--font-sans), ui-sans-serif, system-ui";
    case "inter":
    default:
      return "var(--font-sans), ui-sans-serif, system-ui";
  }
}
