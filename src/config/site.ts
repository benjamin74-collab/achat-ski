// src/config/site.ts
import type { SiteConfig } from "./site.types";
import { meilleurSki } from "./sites/meilleur-ski";
import { meilleurRobot } from "./sites/meilleur-robot";

const sites: Record<string, SiteConfig> = {
  [meilleurSki.id]: meilleurSki,
  [meilleurRobot.id]: meilleurRobot,
};

export function getSiteConfig(siteId?: string): SiteConfig {
  const id = siteId || process.env.SITE_ID || "meilleur-ski";
  return sites[id] ?? meilleurSki;
}

// pratique : config “courante”
export const site = getSiteConfig();
