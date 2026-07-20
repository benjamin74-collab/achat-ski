import type { CsvRow } from "./csv";
import type { NormalizedFeedItem } from "./feed-types";

import {
  decodeHtml,
  normalizeAvailability,
  normalizeBrandName,
  normalizeEan,
  normalizeProductName,
  safeNumber,
  safeString,
} from "./normalize";

export function normalizeTontonRow(row: CsvRow): NormalizedFeedItem {
  const title = safeString(row["title"]) ?? "";

  const cleanName = normalizeProductName(title);

  const merchantCategoryPath =
    safeString(row["custom_label_4"]) ??
    safeString(row["product category"]);

  return {
    merchantSlug: "tonton-outdoor",
    merchantPlatform: "KWANKO",

    externalId: safeString(row["id"]),
    parentExternalId: undefined,

    ean: normalizeEan(row["universal reference"]),
    manufacturerReference: safeString(row["manufacturer reference"]),

    title,
    cleanName,

    brand: normalizeBrandName(row["brand"]),
    description: decodeHtml(row["description"]),
    categoryPath: merchantCategoryPath,

    size: safeString(row["size"]),
    color: undefined,
    gender: extractGenderFromTitle(title),

    price: safeNumber(row["current price"]) ?? 0,
    oldPrice: safeNumber(row["old price"]),
    shippingCost: safeNumber(row["shipping costs"]),

    currency: "EUR",

    availability: safeString(row["product availability"]),
    inStock: normalizeAvailability(row["product availability"]),

    affiliateUrl: safeString(row["product link"]) ?? "",
    merchantProductUrl: undefined,
    imageUrl: safeString(row["image link"]),

    rawData: row,
  };
}

export function normalizeTontonFeed(rows: CsvRow[]): NormalizedFeedItem[] {
  return rows
    .map(normalizeTontonRow)
    .filter((item) => item.title.length > 0);
}

function extractGenderFromTitle(title: string): string | undefined {
  const normalized = title.toUpperCase();

  if (normalized.includes("FEMME")) return "Femme";
  if (normalized.includes("HOMME")) return "Homme";
  if (normalized.includes("ENFANT") || normalized.includes("JUNIOR")) return "Junior";

  return undefined;
}