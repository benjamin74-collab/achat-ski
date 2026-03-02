// src/lib/consent.ts
import { cookies } from "next/headers";

export type Consent = "essential" | "all";

export const CONSENT_COOKIE = "ms_consent";
export const CONSENT_VERSION = "v1"; // incrémente si tu modifies le texte / logique
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180; // 180 jours (tu peux ajuster)

export function getConsentServer(): Consent | null {
  const c = cookies().get(CONSENT_COOKIE)?.value;
  if (c === "essential" || c === "all") return c;
  return null;
}

export function hasAllConsentServer(): boolean {
  return getConsentServer() === "all";
}