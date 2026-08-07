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
  return resolveBrandAlias(
    value
  );
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

type ProductNameLike = Pick<
  NormalizedFeedItem,
  "title"
> &
  Partial<
    Pick<
      NormalizedFeedItem,
      "brand" | "cleanName" | "size" | "color" | "gender"
    >
  >;

export function cleanProductDisplayName(item: NormalizedFeedItem): string {
  const cleanName =
    normalizeText(item.cleanName);

  const title =
    normalizeText(item.title);

  const baseName =
    cleanName || title;

  const extractedModel =
    extractStructuredProductModelName(item);

  /*
   * Cas typique textile / vêtements :
   *
   * "Picture Pantalon de Ski & Snowboard - Pantalon de ski enfant NINGE BIB - Enfant - 10 - Bleu"
   *
   * Le cleanName marchand peut être trop générique :
   * "Picture Pantalon de Ski & Snowboard"
   *
   * On préfère alors le vrai modèle extrait du titre :
   * "Ninge Bib"
   */
  if (
    extractedModel &&
    (
      isLikelyGenericProductName(baseName, item.brand) ||
      hasGenericStructuredTitlePrefix(item)
    )
  ) {
    return extractedModel;
  }

  const cleaned =
    stripKnownVariantSuffixes(baseName, item);

  return cleaned || title;
}

export function buildProductSlug(
  item: Pick<
    NormalizedFeedItem,
    "brand" | "cleanName" | "title"
  > &
    Partial<
      Pick<
        NormalizedFeedItem,
        "size" | "color" | "gender"
      >
    >
): string {
  const name =
    cleanProductDisplayName(
      item as NormalizedFeedItem
    ) ||
    item.cleanName ||
    item.title;

  return slugify(
    [item.brand, normalizeProductName(name)]
      .filter(Boolean)
      .join(" ")
  );
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

  const displayName =
    cleanProductDisplayName(item);

  return [
    merchant,
    "name",
    normalizeText(item.brand).toUpperCase(),
    normalizeProductName(displayName || item.cleanName || item.title),
  ].join(":");
}

function extractStructuredProductModelName(
  item: ProductNameLike
): string {
  const title =
    normalizeText(item.title);

  if (!title) {
    return "";
  }

  const segments =
    splitTitleSegments(title);

  if (segments.length < 2) {
    return "";
  }

  const candidates =
    segments
      .map((segment, index) => {
        const candidate =
          cleanStructuredTitleSegment(
            segment,
            item
          );

        if (!candidate) {
          return null;
        }

        if (
          isLikelyGenericProductName(
            candidate,
            item.brand
          )
        ) {
          return null;
        }

        return {
          value:
            formatExtractedProductModelName(
              candidate
            ),
          score:
            scoreStructuredTitleCandidate(
              segment,
              candidate,
              index
            ),
        };
      })
      .filter(
        (
          candidate
        ): candidate is {
          value: string;
          score: number;
        } => Boolean(candidate)
      )
      .sort(
        (a, b) =>
          b.score - a.score
      );

  return candidates[0]?.value ?? "";
}

function splitTitleSegments(
  title: string
): string[] {
  return title
    .split(/\s+[-–—]\s+/g)
    .map((segment) =>
      normalizeText(segment)
    )
    .filter(Boolean);
}

function hasGenericStructuredTitlePrefix(
  item: ProductNameLike
): boolean {
  const title =
    normalizeText(item.title);

  const segments =
    splitTitleSegments(title);

  if (segments.length < 2) {
    return false;
  }

  return isLikelyGenericProductName(
    segments[0],
    item.brand
  );
}

function cleanStructuredTitleSegment(
  segment: string,
  item: ProductNameLike
): string {
  if (
    isKnownVariantSegment(
      segment,
      item
    )
  ) {
    return "";
  }

  let value =
    removeLeadingBrandAliasesFromProductName(
      segment,
      item.brand
    );

  value =
    stripKnownVariantSuffixes(
      value,
      item
    );

  value =
    removeGenericProductWords(
      value
    );

  value = value
    .replace(/[()[\]{}]/g, " ")
    .replace(/\s*[|/]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (
    !value ||
    isKnownVariantSegment(
      value,
      item
    )
  ) {
    return "";
  }

  return value;
}

function scoreStructuredTitleCandidate(
  originalSegment: string,
  candidate: string,
  index: number
): number {
  let score =
    candidate.length;

  if (index > 0) {
    score += 60;
  }

  if (
    candidate
      .split(/\s+/)
      .filter(Boolean)
      .length >= 2
  ) {
    score += 15;
  }

  if (
    /[A-ZÀ-ÖØ-Þ]{2,}/.test(
      originalSegment
    )
  ) {
    score += 10;
  }

  return score;
}

function stripKnownVariantSuffixes(
  value: string,
  item: ProductNameLike
): string {
  let name =
    normalizeText(value);

  for (const rawValue of [
    item.size,
    item.color,
    item.gender,
  ]) {
    const normalized =
      normalizeText(rawValue);

    if (!normalized) {
      continue;
    }

    const escaped =
      escapeRegExp(normalized);

    name = name
      .replace(
        new RegExp(
          `\\s*[-–—|/]\\s*${escaped}\\s*$`,
          "i"
        ),
        ""
      )
      .replace(
        new RegExp(
          `\\s+${escaped}\\s*$`,
          "i"
        ),
        ""
      )
      .trim();
  }

  return name;
}

function isLikelyGenericProductName(
  value: string | null | undefined,
  brand: string | null | undefined
): boolean {
  const withoutBrand =
    removeLeadingBrandAliasesFromProductName(
      value,
      brand
    );

  const normalized =
    normalizeText(withoutBrand)
      .toLowerCase()
      .replace(/[’']/g, " ")
      .replace(/&/g, " ")
      .replace(/[^a-zà-öø-ÿ0-9]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  if (!normalized) {
    return true;
  }

  const remaining =
    removeGenericProductWords(
      normalized
    )
      .replace(/[^a-z0-9]+/gi, "")
      .trim();

  if (!remaining) {
    return true;
  }

  const words =
    normalized
      .split(/\s+/)
      .filter(Boolean);

  if (
    words.length <= 4 &&
    words.every((word) =>
      GENERIC_PRODUCT_WORDS.has(
        normalizeText(word).toLowerCase()
      )
    )
  ) {
    return true;
  }

  return false;
}

function removeLeadingBrandAliasesFromProductName(
  name: string | null | undefined,
  brand: string | null | undefined
): string {
  let result =
    normalizeText(name);

  if (!result) {
    return "";
  }

  const aliases =
    getBrandPrefixAliases(brand);

  let changed = true;

  while (changed) {
    changed = false;

    for (const alias of aliases) {
      const cleanAlias =
        normalizeText(alias);

      if (!cleanAlias) {
        continue;
      }

      const escaped =
        escapeRegExp(cleanAlias);

      const next =
        result
          .replace(
            new RegExp(
              `^(?:${escaped})(?:\\s+|\\s*[-–—:|/]\\s*)`,
              "i"
            ),
            ""
          )
          .trim();

      if (next !== result) {
        result = next;
        changed = true;
      }
    }
  }

  return result;
}

function getBrandPrefixAliases(
  brand: string | null | undefined
): string[] {
  const aliases =
    new Set<string>();

  const normalizedBrand =
    normalizeText(brand);

  if (normalizedBrand) {
    aliases.add(normalizedBrand);

    const resolved =
      resolveBrandAlias(
        normalizedBrand
      );

    if (resolved) {
      aliases.add(resolved);
    }
  }

  const brandKey =
    normalizeBrandKey(
      normalizedBrand
    );

  if (
    brandKey ===
    normalizeBrandKey(
      "Picture Organic"
    )
  ) {
    aliases.add("Picture");
    aliases.add("Picture Organic Clothing");
    aliases.add("Picture Organic");
  }

  if (
    brandKey ===
    normalizeBrandKey(
      "The North Face"
    )
  ) {
    aliases.add("North Face");
    aliases.add("The North Face");
  }

  return Array.from(aliases).sort(
    (a, b) => b.length - a.length
  );
}

function removeGenericProductWords(
  value: string
): string {
  return normalizeText(value)
    .replace(/[’']/g, " ")
    .replace(/&/g, " ")
    .replace(
      new RegExp(
        `\\b(?:${[
          ...GENERIC_PRODUCT_WORDS,
        ]
          .map(escapeRegExp)
          .join("|")})\\b`,
        "gi"
      ),
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function isKnownVariantSegment(
  value: string,
  item: ProductNameLike
): boolean {
  const normalized =
    normalizeText(value)
      .toLowerCase()
      .replace(/[’']/g, " ")
      .replace(/[^a-z0-9]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  if (!normalized) {
    return true;
  }

  for (const rawValue of [
    item.size,
    item.color,
    item.gender,
  ]) {
    const reference =
      normalizeText(rawValue)
        .toLowerCase()
        .replace(/[’']/g, " ")
        .replace(/[^a-z0-9]+/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (
      reference &&
      normalized === reference
    ) {
      return true;
    }
  }

  if (
    /^(xxxs|xxs|xs|s|m|l|xl|xxl|xxxl|[2-9]xl)$/i.test(
      normalized
    )
  ) {
    return true;
  }

  if (
    /^\d{1,3}(?:[./-]\d{1,3})?$/.test(
      normalized
    )
  ) {
    return true;
  }

  if (
    /^\d{1,2}\s?(?:ans|years?)?$/.test(
      normalized
    )
  ) {
    return true;
  }

  return VARIANT_WORDS.has(
    normalized
  );
}

function formatExtractedProductModelName(
  value: string
): string {
  const normalized =
    normalizeText(value);

  const letters =
    normalized.replace(
      /[^A-Za-zÀ-ÖØ-öø-ÿ]/g,
      ""
    );

  if (!letters) {
    return normalized;
  }

  const isAllUppercase =
    letters === letters.toUpperCase();

  if (!isAllUppercase) {
    return normalized;
  }

  return normalized
    .toLocaleLowerCase("fr-FR")
    .replace(
      /(^|[\s\-/'’])([a-zà-öø-ÿ0-9])/g,
      (
        _match,
        separator: string,
        letter: string
      ) =>
        separator +
        letter.toLocaleUpperCase(
          "fr-FR"
        )
    )
    .replace(
      /\b(?:gtx|mips|boa|otg|mnc|wtr|dva|arva|abs|gps|3l|2l)\b/gi,
      (match) =>
        match.toUpperCase()
    );
}

const GENERIC_PRODUCT_WORDS =
  new Set([
    "accessoire",
    "accessoires",
    "adulte",
    "alpin",
    "alpine",
    "and",
    "anorak",
    "anoraks",
    "baselayer",
    "blouson",
    "blousons",
    "boot",
    "boots",
    "casque",
    "casques",
    "chaussure",
    "chaussures",
    "child",
    "children",
    "de",
    "des",
    "du",
    "enfant",
    "enfants",
    "et",
    "femme",
    "femmes",
    "fille",
    "filles",
    "garcon",
    "garcons",
    "gant",
    "gants",
    "hardshell",
    "helmet",
    "homme",
    "hommes",
    "jacket",
    "jackets",
    "junior",
    "kid",
    "kids",
    "masque",
    "masques",
    "men",
    "mixte",
    "moufle",
    "moufles",
    "pant",
    "pants",
    "pantalon",
    "pantalons",
    "parka",
    "parkas",
    "ski",
    "snow",
    "snowboard",
    "technical",
    "technique",
    "unisex",
    "unisexe",
    "vest",
    "veste",
    "vestes",
    "vetement",
    "vetements",
    "women",
  ]);

const VARIANT_WORDS =
  new Set([
    "adulte",
    "beige",
    "black",
    "bleu",
    "blue",
    "blanc",
    "blanche",
    "brown",
    "enfant",
    "femme",
    "green",
    "gris",
    "grise",
    "grey",
    "homme",
    "jaune",
    "junior",
    "kid",
    "kids",
    "marron",
    "mixte",
    "noir",
    "noire",
    "orange",
    "pink",
    "purple",
    "red",
    "rose",
    "rouge",
    "vert",
    "verte",
    "violet",
    "violette",
    "white",
    "yellow",
  ]);

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

const BRAND_ALIASES: Record<
  string,
  string
> = {
  picture: "Picture Organic",

  "picture organic clothing":
    "Picture Organic",

  "north face":
    "The North Face",

  "the north face":
    "The North Face",
};

export function resolveBrandAlias(
  value: string | null | undefined
): string | undefined {
  const normalized =
    normalizeText(value);

  if (!normalized) {
    return undefined;
  }

  const key =
    normalized
      .toLowerCase()
      .trim();

  return (
    BRAND_ALIASES[key] ??
    normalized
  );
}