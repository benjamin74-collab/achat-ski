import type { CsvRow } from "./csv";

import type {
  FeedNormalizerContext,
  MerchantPlatform,
  NormalizedFeedItem,
} from "./feed-types";

import {
  decodeHtml,
  normalizeAvailability,
  normalizeBrandName,
  normalizeEan,
  normalizeProductName,
  normalizeText,
  removeLeadingBrandFromProductName,
  safeNumber,
  safeString,
} from "./normalize";

/**
 * Champs normalisés acceptés par le moteur d’import.
 *
 * Les valeurs enregistrées dans FeedColumnMapping.targetField
 * devront correspondre à l’un de ces champs.
 */
export type FeedTargetField =
  | "externalId"
  | "parentExternalId"
  | "ean"
  | "manufacturerReference"
  | "title"
  | "cleanName"
  | "brand"
  | "description"
  | "categoryPath"
  | "size"
  | "color"
  | "gender"
  | "price"
  | "oldPrice"
  | "shippingCost"
  | "currency"
  | "availability"
  | "inStock"
  | "affiliateUrl"
  | "merchantProductUrl"
  | "imageUrl";

/**
 * Transformations simples applicables aux valeurs issues du flux.
 *
 * Elles permettront ensuite de configurer un flux depuis le BO
 * sans créer un normaliseur TypeScript spécifique.
 */
export type FeedColumnTransform =
  | "NONE"
  | "TRIM"
  | "TEXT"
  | "UPPERCASE"
  | "LOWERCASE"
  | "NUMBER"
  | "EAN"
  | "BRAND"
  | "PRODUCT_NAME"
  | "HTML"
  | "BOOLEAN"
  | "AVAILABILITY";

/**
 * Configuration d’un champ normalisé.
 *
 * sourceColumns :
 * liste ordonnée de colonnes possibles dans le flux.
 *
 * Exemple :
 *
 * {
 *   targetField: "title",
 *   sourceColumns: [
 *     "name of the product",
 *     "product name",
 *     "title"
 *   ]
 * }
 */
export type RuntimeColumnMapping = {
  targetField: FeedTargetField;
  sourceColumns: string[];

  fallbackValue?: string | null;
  transform?: FeedColumnTransform | null;

  required?: boolean;
  active?: boolean;
};

/**
 * Configuration complète utilisée par le normaliseur universel.
 */
export type GenericFeedNormalizerConfig = {
  mappings: RuntimeColumnMapping[];

  merchantSlug: string;
  merchantPlatform: MerchantPlatform;

  defaultCurrency?: string;
};

/**
 * Normalise un flux entier depuis les correspondances configurées.
 */
export function normalizeGenericFeed(
  rows: CsvRow[],
  config: GenericFeedNormalizerConfig,
  context?: FeedNormalizerContext
): NormalizedFeedItem[] {
  return rows
    .map((row) =>
      normalizeGenericFeedRow(
        row,
        config,
        context
      )
    )
    .filter(
      (
        item
      ): item is NormalizedFeedItem =>
        item !== null
    );
}

/**
 * Transforme une ligne brute en NormalizedFeedItem.
 *
 * Une ligne ne possédant aucun titre est ignorée.
 * Les autres contrôles restent gérés dans validate.ts.
 */
export function normalizeGenericFeedRow(
  row: CsvRow,
  config: GenericFeedNormalizerConfig,
  context?: FeedNormalizerContext
): NormalizedFeedItem | null {
  const mappedValues =
    extractMappedValues(
      row,
      config.mappings
    );

  const title =
    toOptionalString(
      mappedValues.title
    ) ?? "";

  if (!title) {
    return null;
  }

	const brand = normalizeBrandName(
	  toOptionalString(mappedValues.brand)
	);

	const rawCleanName =
	  toOptionalString(mappedValues.cleanName) ??
	  normalizeProductName(title);

	const cleanName =
	  removeLeadingBrandFromProductName(
		rawCleanName,
		brand
  );

  const availability =
    toOptionalString(
      mappedValues.availability
    );

  const explicitStockValue =
    toOptionalBoolean(
      mappedValues.inStock
    );

  const inStock =
    explicitStockValue ??
    normalizeAvailability(
      availability
    );

  const currency =
    toOptionalString(
      mappedValues.currency
    ) ??
    config.defaultCurrency ??
    "EUR";

  const merchantSlug =
    context?.config.merchantSlug ??
    config.merchantSlug;

  const merchantPlatform =
    context?.config
      .merchantPlatform ??
    config.merchantPlatform;

  return {
    merchantSlug,
    merchantPlatform,

    externalId:
      toOptionalString(
        mappedValues.externalId
      ),

    parentExternalId:
      toOptionalString(
        mappedValues.parentExternalId
      ),

    ean: normalizeEan(
      toOptionalString(
        mappedValues.ean
      )
    ),

    manufacturerReference:
      toOptionalString(
        mappedValues
          .manufacturerReference
      ),

    title,
    cleanName,
	brand,

    description: decodeHtml(
      toOptionalString(
        mappedValues.description
      )
    ),

    categoryPath:
      toOptionalString(
        mappedValues.categoryPath
      ),

    size:
      toOptionalString(
        mappedValues.size
      ),

    color:
      toOptionalString(
        mappedValues.color
      ),

    gender:
      toOptionalString(
        mappedValues.gender
      ),

    price:
      toOptionalNumber(
        mappedValues.price
      ) ?? 0,

    oldPrice:
      toOptionalNumber(
        mappedValues.oldPrice
      ),

    shippingCost:
      toOptionalNumber(
        mappedValues.shippingCost
      ),

    currency,

    availability,
    inStock,

    affiliateUrl:
      toOptionalString(
        mappedValues.affiliateUrl
      ) ?? "",

    merchantProductUrl:
      toOptionalString(
        mappedValues
          .merchantProductUrl
      ),

    imageUrl:
      toOptionalString(
        mappedValues.imageUrl
      ),

    rawData: row,
  };
}

/**
 * Extrait tous les champs normalisés configurés.
 */
function extractMappedValues(
  row: CsvRow,
  mappings: RuntimeColumnMapping[]
): Partial<
  Record<FeedTargetField, unknown>
> {
  const result: Partial<
    Record<FeedTargetField, unknown>
  > = {};

  for (const mapping of mappings) {
    if (mapping.active === false) {
      continue;
    }

    const rawValue =
      getFirstAvailableColumn(
        row,
        mapping.sourceColumns
      ) ??
      mapping.fallbackValue ??
      undefined;

    const transformedValue =
      applyColumnTransform(
        rawValue,
        mapping.transform ??
          defaultTransformForField(
            mapping.targetField
          )
      );

    if (
      transformedValue !== undefined &&
      transformedValue !== null &&
      transformedValue !== ""
    ) {
      result[mapping.targetField] =
        transformedValue;
    }
  }

  return result;
}

/**
 * Recherche une colonne sans tenir compte :
 *
 * - de la casse ;
 * - des espaces multiples ;
 * - du BOM UTF-8 ;
 * - des tirets et underscores.
 */
function getFirstAvailableColumn(
  row: CsvRow,
  possibleColumns: string[]
): string | undefined {
  if (possibleColumns.length === 0) {
    return undefined;
  }

  const normalizedEntries =
    Object.entries(row).map(
      ([columnName, value]) => [
        normalizeHeader(columnName),
        value,
      ] as const
    );

  for (const possibleColumn of possibleColumns) {
    const expectedHeader =
      normalizeHeader(possibleColumn);

    const match =
      normalizedEntries.find(
        ([header]) =>
          header === expectedHeader
      );

    if (
      match &&
      normalizeText(match[1])
    ) {
      return match[1];
    }
  }

  return undefined;
}

function normalizeHeader(
  value: string
): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Détermine la transformation naturelle d’un champ lorsque
 * aucune transformation n’est configurée en base.
 */
function defaultTransformForField(
  targetField: FeedTargetField
): FeedColumnTransform {
  switch (targetField) {
    case "price":
    case "oldPrice":
    case "shippingCost":
      return "NUMBER";

    case "ean":
      return "EAN";

    case "brand":
      return "BRAND";

    case "cleanName":
      return "PRODUCT_NAME";

    case "description":
      return "HTML";

    case "inStock":
      return "BOOLEAN";

    case "availability":
      return "TEXT";

    default:
      return "TEXT";
  }
}

/**
 * Applique une transformation déclarative à une valeur brute.
 */
function applyColumnTransform(
  value: unknown,
  transform: FeedColumnTransform
): unknown {
  if (
    value === null ||
    value === undefined
  ) {
    return undefined;
  }

  switch (transform) {
    case "NONE":
      return value;

    case "TRIM":
    case "TEXT":
      return safeString(value);

    case "UPPERCASE":
      return safeString(
        value
      )?.toUpperCase();

    case "LOWERCASE":
      return safeString(
        value
      )?.toLowerCase();

    case "NUMBER":
      return safeNumber(value);

    case "EAN":
      return normalizeEan(
        safeString(value)
      );

    case "BRAND":
      return normalizeBrandName(
        safeString(value)
      );

    case "PRODUCT_NAME":
      return normalizeProductName(
        safeString(value)
      );

    case "HTML":
      return decodeHtml(
        safeString(value)
      );

    case "BOOLEAN":
      return parseBoolean(value);

    case "AVAILABILITY":
      return normalizeAvailability(
        safeString(value)
      );

    default:
      return safeString(value);
  }
}

function toOptionalString(
  value: unknown
): string | undefined {
  return safeString(value);
}

function toOptionalNumber(
  value: unknown
): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : undefined;
  }

  return safeNumber(value);
}

function toOptionalBoolean(
  value: unknown
): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  return parseBoolean(value);
}

function parseBoolean(
  value: unknown
): boolean | undefined {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  const normalized =
    normalizeText(String(value))
      .toLowerCase();

  if (
    [
      "1",
      "true",
      "yes",
      "oui",
      "y",
      "o",
      "in stock",
      "en stock",
      "available",
      "disponible",
    ].includes(normalized)
  ) {
    return true;
  }

  if (
    [
      "0",
      "false",
      "no",
      "non",
      "n",
      "out of stock",
      "rupture",
      "indisponible",
      "unavailable",
    ].includes(normalized)
  ) {
    return false;
  }

  return undefined;
}

/**
 * Vérifie que les mappings indispensables sont présents.
 *
 * Cette fonction servira dans le moteur universel avant de lancer
 * un import afin d’éviter un traitement inutile.
 */
export function validateRuntimeColumnMappings(
  mappings: RuntimeColumnMapping[]
): string[] {
  const errors: string[] = [];

  const activeTargets = new Set(
    mappings
      .filter(
        (mapping) =>
          mapping.active !== false
      )
      .map(
        (mapping) =>
          mapping.targetField
      )
  );

  const requiredTargets: FeedTargetField[] =
    [
      "title",
      "price",
      "affiliateUrl",
    ];

  for (const targetField of requiredTargets) {
    if (
      !activeTargets.has(targetField)
    ) {
      errors.push(
        `Aucun mapping actif n’est configuré pour le champ obligatoire "${targetField}".`
      );
    }
  }

  for (const mapping of mappings) {
    if (mapping.active === false) {
      continue;
    }

    const hasSourceColumn =
      mapping.sourceColumns.some(
        (column) =>
          Boolean(
            normalizeText(column)
          )
      );

    const hasFallback =
      Boolean(
        normalizeText(
          mapping.fallbackValue
        )
      );

    if (
      !hasSourceColumn &&
      !hasFallback
    ) {
      errors.push(
        `Le mapping "${mapping.targetField}" ne possède ni colonne source ni valeur par défaut.`
      );
    }
  }

  return errors;
}