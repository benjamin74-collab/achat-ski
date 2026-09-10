export type NormalizedBrand = {
  name: string;
  slug: string;
};

const BRAND_ALIASES: Record<string, NormalizedBrand> = {
  // 100%
  "100%": {
    name: "100%",
    slug: "100",
  },
  "100% ski": {
    name: "100%",
    slug: "100",
  },
  "100percent": {
    name: "100%",
    slug: "100",
  },
  "100 percent": {
    name: "100%",
    slug: "100",
  },
  "100-percent": {
    name: "100%",
    slug: "100",
  },

  // ATK
  "atk": {
    name: "ATK Bindings",
    slug: "atk-bindings",
  },
  "atk bindings": {
    name: "ATK Bindings",
    slug: "atk-bindings",
  },

  // Giro
  "giro": {
    name: "Giro",
    slug: "giro",
  },
  "giro ski": {
    name: "Giro",
    slug: "giro",
  },

  // Nitro
  "nitro": {
    name: "Nitro",
    slug: "nitro",
  },
  "nitro snowboard": {
    name: "Nitro",
    slug: "nitro",
  },
  "nitro snowboards": {
    name: "Nitro",
    slug: "nitro",
  },

  // Roxy
  "roxy": {
    name: "Roxy",
    slug: "roxy",
  },
  "roxy ski": {
    name: "Roxy",
    slug: "roxy",
  },
};

function normalizeAliasKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeBrand(
  value: string
): NormalizedBrand | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const aliasKey = normalizeAliasKey(trimmed);

  const knownAlias = BRAND_ALIASES[aliasKey];

  if (knownAlias) {
    return knownAlias;
  }

  return null;
}