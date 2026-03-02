// src/lib/consent.ts
export const CONSENT_COOKIE = "ms_consent";
export const CONSENT_VERSION = "v1";
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180; // 180 jours

export type Consent = "essential" | "all";

export function storageKey() {
  return `ms_consent_${CONSENT_VERSION}`;
}

export function getConsentClient(): Consent | null {
  if (typeof window === "undefined") return null;

  // 1) localStorage
  try {
    const v = window.localStorage.getItem(storageKey());
    if (v === "essential" || v === "all") return v;
  } catch {
    // ignore
  }

  // 2) cookie fallback
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
    const v = m ? decodeURIComponent(m[1]) : null;
    if (v === "essential" || v === "all") return v;
  } catch {
    // ignore
  }

  return null;
}

export function setConsentClient(v: Consent) {
  if (typeof window === "undefined") return;

  // localStorage (versionné)
  try {
    window.localStorage.setItem(storageKey(), v);
  } catch {
    // ignore
  }

  // cookie (pour lecture simple côté serveur si besoin)
  try {
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(v)}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax`;
  } catch {
    // ignore
  }

  // event utile si tu veux conditionner l’injection ads/analytics
  window.dispatchEvent(new CustomEvent("ms:consent", { detail: v }));
}

export function clearConsentClient() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey());
  } catch {
    // ignore
  }
  try {
    document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
  } catch {
    // ignore
  }
}