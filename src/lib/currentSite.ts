// src/lib/currentSite.ts
import { headers } from "next/headers";

/**
 * Récupère le host courant proprement.
 * - supprime le port
 * - supprime le www
 * - met en minuscule
 */
export function getCurrentHost(): string {
  const h = headers();

  const hostHeader =
    h.get("x-forwarded-host") ||
    h.get("host") ||
    "";

  return hostHeader
    .toLowerCase()
    .split(":")[0]
    .replace(/^www\./, "");
}

/**
 * Convertit un host en siteId
 */
export function getSiteIdFromHost(host: string): string {
  const raw = process.env.SITE_HOST_MAP;

  if (raw) {
    try {
      const map = JSON.parse(raw) as Record<string, string>;

      if (map[host]) {
        return map[host];
      }
    } catch {
      // ignore erreur JSON
    }
  }

  // fallback heuristique
  if (host.includes("meilleur-robot")) return "meilleur-robot";

  if (
    host.includes("meilleur-ski") ||
    host.includes("achat-ski")
  ) {
    return "meilleur-ski";
  }

  return process.env.DEFAULT_SITE_SLUG || "meilleur-ski";
}

/**
 * Site courant basé sur le host HTTP
 */
export function getCurrentSiteId(): string {
  const host = getCurrentHost();
  return getSiteIdFromHost(host);
}

/**
 * URL complète du site courant
 * (utile pour canonical SEO)
 */
export function getCurrentSiteUrl(): string {
  const host = getCurrentHost();

  const protocol =
    process.env.NODE_ENV === "development"
      ? "http"
      : "https";

  return `${protocol}://${host}`;
}