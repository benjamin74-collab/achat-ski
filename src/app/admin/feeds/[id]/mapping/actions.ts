"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const DEFAULT_COLUMN_MAPPINGS = [
  {
    targetField: "title",
    sourceColumn: "title",
    fallbackColumns: [
      "name",
      "product_name",
      "productName",
      "designation",
      "label",
    ],
    required: true,
    defaultValue: null,
    transform: "TEXT",
    order: 10,
  },
  {
    targetField: "price",
    sourceColumn: "price",
    fallbackColumns: [
      "sale_price",
      "selling_price",
      "current_price",
      "product_price",
    ],
    required: true,
    defaultValue: null,
    transform: "NUMBER",
    order: 20,
  },
  {
    targetField: "affiliateUrl",
    sourceColumn: "affiliate_url",
    fallbackColumns: [
      "tracking_url",
      "deep_link",
      "deeplink",
      "product_affiliate_url",
      "url",
    ],
    required: true,
    defaultValue: null,
    transform: "TEXT",
    order: 30,
  },
  {
    targetField: "gtin",
    sourceColumn: "gtin",
    fallbackColumns: [
      "ean",
      "ean13",
      "ean_13",
      "barcode",
      "product_ean",
    ],
    required: false,
    defaultValue: null,
    transform: "EAN",
    order: 40,
  },
  {
    targetField: "externalId",
    sourceColumn: "external_id",
    fallbackColumns: [
      "id",
      "product_id",
      "sku",
      "merchant_product_id",
    ],
    required: false,
    defaultValue: null,
    transform: "TEXT",
    order: 50,
  },
  {
    targetField: "parentExternalId",
    sourceColumn: "parent_external_id",
    fallbackColumns: [
      "parent_id",
      "group_id",
      "item_group_id",
      "family_id",
    ],
    required: false,
    defaultValue: null,
    transform: "TEXT",
    order: 60,
  },
  {
    targetField: "brand",
    sourceColumn: "brand",
    fallbackColumns: [
      "brand_name",
      "manufacturer",
      "manufacturer_name",
    ],
    required: false,
    defaultValue: null,
    transform: "TEXT",
    order: 70,
  },
  {
    targetField: "manufacturerReference",
    sourceColumn: "manufacturer_reference",
    fallbackColumns: [
      "mpn",
      "manufacturer_part_number",
      "product_reference",
      "reference",
    ],
    required: false,
    defaultValue: null,
    transform: "TEXT",
    order: 80,
  },
  {
    targetField: "description",
    sourceColumn: "description",
    fallbackColumns: [
      "product_description",
      "long_description",
      "short_description",
    ],
    required: false,
    defaultValue: null,
    transform: "TEXT",
    order: 90,
  },
  {
    targetField: "imageUrl",
    sourceColumn: "image_url",
    fallbackColumns: [
      "image",
      "image_link",
      "product_image",
      "picture_url",
    ],
    required: false,
    defaultValue: null,
    transform: "TEXT",
    order: 100,
  },
  {
    targetField: "categoryPath",
    sourceColumn: "category_path",
    fallbackColumns: [
      "category",
      "categories",
      "product_category",
      "category_name",
    ],
    required: false,
    defaultValue: null,
    transform: "TEXT",
    order: 110,
  },
  {
    targetField: "oldPrice",
    sourceColumn: "old_price",
    fallbackColumns: [
      "regular_price",
      "original_price",
      "retail_price",
      "price_before_discount",
    ],
    required: false,
    defaultValue: null,
    transform: "NUMBER",
    order: 120,
  },
  {
    targetField: "shippingCost",
    sourceColumn: "shipping_cost",
    fallbackColumns: [
      "shipping",
      "delivery_cost",
      "delivery_price",
    ],
    required: false,
    defaultValue: null,
    transform: "NUMBER",
    order: 130,
  },
  {
    targetField: "currency",
    sourceColumn: "currency",
    fallbackColumns: [
      "currency_code",
      "price_currency",
    ],
    required: false,
    defaultValue: "EUR",
    transform: "TEXT",
    order: 140,
  },
  {
    targetField: "availability",
    sourceColumn: "availability",
    fallbackColumns: [
      "stock_status",
      "availability_status",
    ],
    required: false,
    defaultValue: null,
    transform: "TEXT",
    order: 150,
  },
  {
    targetField: "inStock",
    sourceColumn: "in_stock",
    fallbackColumns: [
      "instock",
      "available",
      "stock",
    ],
    required: false,
    defaultValue: null,
    transform: "BOOLEAN",
    order: 160,
  },
  {
    targetField: "merchantProductUrl",
    sourceColumn: "product_url",
    fallbackColumns: [
      "merchant_product_url",
      "link",
      "product_link",
    ],
    required: false,
    defaultValue: null,
    transform: "TEXT",
    order: 170,
  },
] as const;

export async function createDefaultColumnMappingsAction(
  formData: FormData
): Promise<void> {
  const feedId = parsePositiveInteger(
    formData.get("feedId")
  );

  if (!feedId) {
    throw new Error(
      "Identifiant de flux invalide."
    );
  }

  const feed =
    await prisma.feedSource.findUnique({
      where: {
        id: feedId,
      },
      select: {
        id: true,
      },
    });

  if (!feed) {
    throw new Error(
      "Le flux demandé n’existe pas."
    );
  }

  await prisma.$transaction(
    DEFAULT_COLUMN_MAPPINGS.map(
      (mapping) =>
        prisma.feedColumnMapping.upsert({
          where: {
            feedSourceId_targetField: {
              feedSourceId: feedId,
              targetField:
                mapping.targetField,
            },
          },
          update: {},
          create: {
            feedSourceId: feedId,
            targetField:
              mapping.targetField,
            sourceColumn:
              mapping.sourceColumn,
            fallbackColumns: [
              ...mapping.fallbackColumns,
            ],
            required:
              mapping.required,
            defaultValue:
              mapping.defaultValue,
            transform:
              mapping.transform,
            order:
              mapping.order,
          },
        })
    )
  );

  revalidateColumnMappingPages(feedId);
}

export async function updateColumnMappingAction(
  formData: FormData
): Promise<void> {
  const feedId = parsePositiveInteger(
    formData.get("feedId")
  );

  const mappingId = parsePositiveInteger(
    formData.get("mappingId")
  );

  if (!feedId || !mappingId) {
    throw new Error(
      "Identifiant de mapping invalide."
    );
  }

  const existing =
    await prisma.feedColumnMapping.findFirst({
      where: {
        id: mappingId,
        feedSourceId: feedId,
      },
      select: {
        id: true,
      },
    });

  if (!existing) {
    throw new Error(
      "Le mapping demandé n’existe pas."
    );
  }

  const sourceColumn = getString(
    formData.get("sourceColumn")
  );

  const fallbackColumns = parseStringList(
    formData.get("fallbackColumns")
  );

  const defaultValue =
    getNullableString(
      formData.get("defaultValue")
    );

  const transform =
    getNullableString(
      formData.get("transform")
    );

  const required =
    formData.get("required") === "on";

  const order =
    parseInteger(formData.get("order")) ?? 0;

  if (!sourceColumn) {
    throw new Error(
      "La colonne source est obligatoire."
    );
  }

  await prisma.feedColumnMapping.update({
    where: {
      id: mappingId,
    },
    data: {
      sourceColumn,
      fallbackColumns,
      defaultValue,
      transform,
      required,
      order,
    },
  });

  revalidateColumnMappingPages(feedId);
}

function revalidateColumnMappingPages(
  feedId: number
): void {
  revalidatePath(
    `/admin/feeds/${feedId}`
  );

  revalidatePath(
    `/admin/feeds/${feedId}/mapping`
  );
}

function parsePositiveInteger(
  value: FormDataEntryValue | null
): number | null {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return null;
  }

  return parsed;
}

function parseInteger(
  value: FormDataEntryValue | null
): number | null {
  const parsed = Number(value);

  return Number.isInteger(parsed)
    ? parsed
    : null;
}

function getString(
  value: FormDataEntryValue | null
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getNullableString(
  value: FormDataEntryValue | null
): string | null {
  const result = getString(value);
  return result || null;
}

function parseStringList(
  value: FormDataEntryValue | null
): string[] {
  return getString(value)
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter(
      (item, index, values) =>
        values.indexOf(item) === index
    );
}