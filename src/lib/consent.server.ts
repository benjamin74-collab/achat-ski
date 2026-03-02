// src/lib/consent.server.ts
import { cookies } from "next/headers";
import { CONSENT_COOKIE, type Consent } from "./consent";

export async function getConsentServer(): Promise<Consent | null> {
  const store = await cookies();
  const v = store.get(CONSENT_COOKIE)?.value;
  if (v === "essential" || v === "all") return v;
  return null;
}