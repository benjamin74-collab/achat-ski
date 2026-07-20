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

export function normalizeEkosportRow(row: CsvRow): NormalizedFeedItem {
  const title = safeString(row["name of the product"]) ?? "";

  const cleanName =
    safeString(row["name"]) ??
    normalizeProductName(title);

  return {
    merchantSlug: "ekosport",
    merchantPlatform: "KWANKO",

    externalId: safeString(row["internal reference"]),
    parentExternalId: safeString(row["ID_Parent"]),

    ean: normalizeEan(row["EAN or ISBN"]),
    manufacturerReference: safeString(row["manufacturer reference"]),

    title,
    cleanName,

    brand: normalizeBrandName(row["brand"]),
    description: decodeHtml(row["description"]),
    categoryPath: safeString(row["product category"]),

    size: safeString(row["Taille"]),
    gender: safeString(row["Genre"]),
    color: safeString(row["Color"]),

    price: safeNumber(row["current price"]) ?? 0,
    oldPrice: safeNumber(row["crossed price"]),
    shippingCost: safeNumber(row["shipping costs"]),

    currency: "EUR",

    availability: safeString(row["product availability"]),
    inStock: normalizeAvailability(row["product availability"]),

    affiliateUrl:
      safeString(row["URL"]) ??
      safeString(row["product page URL"]) ??
      "",

    merchantProductUrl: safeString(row["product page URL"]),
    imageUrl: safeString(row["big image"]),

    rawData: row,
  };
}

export function normalizeEkosportFeed(rows: CsvRow[]): NormalizedFeedItem[] {
  return rows
    .map(normalizeEkosportRow)
    .filter((item) => item.title.length > 0);
}