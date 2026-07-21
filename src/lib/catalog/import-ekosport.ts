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

function getColumn(
  row: CsvRow,
  ...possibleNames: string[]
): string | undefined {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [
    normalizeHeader(key),
    value,
  ] as const);

  for (const possibleName of possibleNames) {
    const expected = normalizeHeader(possibleName);

    const match = normalizedEntries.find(([key]) => key === expected);

    if (match) {
      return match[1];
    }
  }

  return undefined;
}

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeEkosportRow(row: CsvRow): NormalizedFeedItem {
  const title =
    safeString(
      getColumn(
        row,
        "name of the product",
        "product name",
        "title",
        "nom du produit"
      )
    ) ?? "";

  const cleanName =
    safeString(
      getColumn(
        row,
        "name",
        "clean name",
        "product clean name"
      )
    ) ?? normalizeProductName(title);

  const availability = getColumn(
    row,
    "product availability",
    "availability",
    "stock indicator"
  );

  const affiliateUrl =
    safeString(
      getColumn(
        row,
        "product page URL",
        "product link",
        "affiliate URL"
      )
    ) ??
    safeString(getColumn(row, "URL")) ??
    "";

  return {
    merchantSlug: "ekosport",
    merchantPlatform: "KWANKO",

    externalId: safeString(
      getColumn(
        row,
        "internal reference",
        "id",
        "product id"
      )
    ),

    parentExternalId: safeString(
      getColumn(
        row,
        "ID_Parent",
        "ID Parent",
        "parent id"
      )
    ),

    ean: normalizeEan(
      getColumn(
        row,
        "EAN or ISBN",
        "EAN",
        "universal reference"
      )
    ),

    manufacturerReference: safeString(
      getColumn(
        row,
        "manufacturer reference",
        "manufacturer_ref"
      )
    ),

    title,
    cleanName,

    brand: normalizeBrandName(
      getColumn(row, "brand", "marque")
    ),

    description: decodeHtml(
      getColumn(row, "description")
    ),

    categoryPath: safeString(
      getColumn(
        row,
        "product category",
        "category"
      )
    ),

    size: safeString(
      getColumn(row, "Taille", "size")
    ),

    gender: safeString(
      getColumn(row, "Genre", "gender")
    ),

    color: safeString(
      getColumn(row, "Color", "Colour", "Couleur")
    ),

    price:
      safeNumber(
        getColumn(
          row,
          "current price",
          "price",
          "sale price"
        )
      ) ?? 0,

    oldPrice: safeNumber(
      getColumn(
        row,
        "crossed price",
        "old price",
        "regular price"
      )
    ),

    shippingCost: safeNumber(
      getColumn(
        row,
        "shipping costs",
        "shipping cost"
      )
    ),

    currency: "EUR",

    availability: safeString(availability),
    inStock: normalizeAvailability(availability),

    affiliateUrl,

    merchantProductUrl: safeString(
      getColumn(
        row,
        "URL",
        "merchant URL",
        "merchant product URL"
      )
    ),

    imageUrl: safeString(
      getColumn(
        row,
        "big image",
        "image link",
        "image URL"
      )
    ),

    rawData: row,
  };
}

export function normalizeEkosportFeed(
  rows: CsvRow[]
): NormalizedFeedItem[] {
  return rows
    .map(normalizeEkosportRow)
    .filter((item) => item.title.length > 0);
}