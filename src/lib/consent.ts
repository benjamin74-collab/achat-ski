// src/lib/consent.ts
import { cookies } from "next/headers";

export const CONSENT_COOKIE = "ms_consent";
export const CONSENT_VERSION = "v1";
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180; // 180 jours

export type Consent = "essential" | "all";

// ✅ Next 15: cookies() est async
export async function getConsentServer(): Promise<Consent | null> {
  const store = await cookies();
  const c = store.get(CONSENT_COOKIE)?.value;
  if (c === "essential" || c === "all") return c;
  return null;
}