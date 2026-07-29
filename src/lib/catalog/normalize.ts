import type { NormalizedFeedItem } from "./feed-types";

export function normalizeText(value: string | null | undefined): string {
  if (!value) return "";

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&amp;/gi, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value: string | null | undefined): string {
  const normalized = normalizeText(value).toLowerCase();

  return normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

export function toPriceCents(
  value: number | string | null | undefined
): number {
  if (value === null || value === undefined || value === "") return 0;

  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value).replace(",", ".").trim());

  if (!Number.isFinite(parsed)) return 0;

  return Math.round(parsed * 100);
}

export function normalizeEan(
  value: string | null | undefined
): string | undefined {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits || undefined;
}

export function normalizeBrandName(
  value: string | null | undefined
): string | undefined {
  const normalized = normalizeText(value);

  return normalized || undefined;
}

/**
 * Produit une clé technique destinée uniquement
 * à comparer deux noms de marque.
 *
 * Cette clé ne doit jamais être utilisée comme
 * nom d'affichage.
 *
 * Exemples :
 * - Arc'Teryx      -> arcteryx
 * - ARC TERYX      -> arcteryx
 * - Norrøna        -> norrona
 * - NORRONA        -> norrona
 * - The North Face -> northface
 * - North Face     -> northface
 */
export function normalizeBrandKey(
  value: string | null | undefined
): string {
  let normalized =
    normalizeText(value);

  if (!normalized) {
    return "";
  }

  normalized = normalized
    .replace(/[øØ]/g, "o")
    .replace(/[æÆ]/g, "ae")
    .replace(/[œŒ]/g, "oe")
    .toLowerCase()
    .trim();

  /*
   * Pour le matching des marques uniquement,
   * "The North Face" et "North Face"
   * doivent être considérés comme identiques.
   */
  normalized = normalized.replace(
    /^the\s+/i,
    ""
  );

  return normalized
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/**
 * Formate raisonnablement le nom d'une nouvelle marque
 * lorsque le flux l'envoie entièrement en majuscules
 * ou entièrement en minuscules.
 *
 * Une marque existante ne doit jamais passer ici :
 * son nom officiel enregistré en base est conservé.
 */
export function formatBrandDisplayName(
  value: string | null | undefined
): string | undefined {
  const normalized =
    normalizeText(value);

  if (!normalized) {
    return undefined;
  }

  const letters = normalized.replace(
    /[^A-Za-zÀ-ÖØ-öø-ÿ]/g,
    ""
  );

  if (!letters) {
    return normalized;
  }

  const isAllUppercase =
    letters === letters.toUpperCase();

  const isAllLowercase =
    letters === letters.toLowerCase();

  /*
   * Si le marchand fournit déjà une casse élaborée,
   * on la conserve.
   *
   * Exemple : Arc'Teryx
   */
  if (
    !isAllUppercase &&
    !isAllLowercase
  ) {
    return normalized;
  }

  const lowercase =
    normalized.toLocaleLowerCase(
      "fr-FR"
    );

  return lowercase.replace(
    /(^|[\s\-/'’])([a-zà-öø-ÿ])/g,
    (
      _match,
      separator: string,
      letter: string
    ) =>
      separator +
      letter.toLocaleUpperCase(
        "fr-FR"
      )
  );
}

export function normalizeAvailability(
  value: string | null | undefined
): boolean {
  const normalized = normalizeText(value).toLowerCase();

  if (!normalized) return false;

  return [
    "in stock",
    "en stock",
    "available",
    "disponible",
    "1",
    "true",
    "yes",
    "oui",
  ].includes(normalized);
}

export function normalizeProductName(
  value: string | null | undefined
): string {
  let normalized = normalizeText(value).toUpperCase();

  normalized = normalized
    .replace(/\bGORE[\s-]?TEX\b/g, "GTX")
    .replace(/\bGORETEX\b/g, "GTX")
    .replace(/\bWOMEN\b/g, "W")
    .replace(/\bWOMAN\b/g, "W")
    .replace(/\bFEMME\b/g, "W")
    .replace(/\bMEN\b/g, "M")
    .replace(/\bHOMME\b/g, "M")
    .replace(/\bUNISEXE\b/g, "MIXTE");

  normalized = normalized
    .replace(/\bTAILLE\s+[A-Z0-9./-]+\b/g, "")
    .replace(/\bSIZE\s+[A-Z0-9./-]+\b/g, "")
    .replace(/\s+-\s+.*$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized;
}

export function removeLeadingBrandFromProductName(
  name: string | null | undefined,
  brand: string | null | undefined
): string {
  const cleanName = normalizeText(name);
  const cleanBrand = normalizeText(brand);

  if (!cleanName || !cleanBrand) {
    return cleanName;
  }

  const escapedBrand = escapeRegExp(cleanBrand);

  const withoutBrand = cleanName
    .replace(
      new RegExp(
        `^(?:${escapedBrand})(?:\\s+|\\s*[-–—:|/]\\s*)`,
        "i"
      ),
      ""
    )
    .trim();

  return withoutBrand || cleanName;
}

/**
 * Conservé pour compatibilité avec d'autres importeurs,
 * mais le moteur V2 ne crée plus de SKU.
 */
export function normalizeVariant(
  item: Pick<NormalizedFeedItem, "size" | "color" | "gender">
): string {
  return [item.size, item.color, item.gender]
    .map((value) => normalizeText(value).toUpperCase())
    .filter(Boolean)
    .join(" | ");
}

export function cleanProductDisplayName(item: NormalizedFeedItem): string {
  let name = normalizeText(item.cleanName || item.title);

  for (const rawValue of [item.size, item.color]) {
    const value = normalizeText(rawValue);
    if (!value) continue;

    const escaped = escapeRegExp(value);

    name = name
      .replace(new RegExp(`\\s*[-–—|/]\\s*${escaped}\\s*$`, "i"), "")
      .replace(new RegExp(`\\s+${escaped}\\s*$`, "i"), "")
      .trim();
  }

  return name || normalizeText(item.title);
}

export function buildProductSlug(
  item: Pick<NormalizedFeedItem, "brand" | "cleanName" | "title">
): string {
  const name = item.cleanName || item.title;
  return slugify([item.brand, normalizeProductName(name)].filter(Boolean).join(" "));
}

export function buildProductGroupKey(item: NormalizedFeedItem): string {
  const merchant = slugify(item.merchantSlug) || "merchant";

  if (item.parentExternalId) {
    return `${merchant}:parent:${normalizeText(item.parentExternalId).toUpperCase()}`;
  }

  if (item.brand && item.manufacturerReference) {
    return [
      merchant,
      "manufacturer",
      normalizeText(item.brand).toUpperCase(),
      normalizeText(item.manufacturerReference).toUpperCase(),
    ].join(":");
  }

  return [
    merchant,
    "name",
    normalizeText(item.brand).toUpperCase(),
    normalizeProductName(item.cleanName || item.title),
  ].join(":");
}

export function safeString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const normalized = normalizeText(String(value));
  return normalized || undefined;
}

export function safeNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;

  const parsed = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function decodeHtml(
  value: string | null | undefined
): string | undefined {
  const normalized = normalizeText(value);
  return normalized || undefined;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeGtin(
  value: string | null | undefined
): string | undefined {
  if (!value) {
    return undefined;
  }

  /*
   * On conserve uniquement les chiffres.
   * Il ne faut surtout pas convertir en Number :
   * certains codes peuvent commencer par zéro.
   */
  const normalized = value.replace(/\D/g, "");

  if (
    ![8, 12, 13, 14].includes(
      normalized.length
    )
  ) {
    return undefined;
  }

  return normalized;
}