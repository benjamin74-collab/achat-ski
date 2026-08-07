// prisma/backfill-product-identifiers.ts
import {
  ProductIdentifierType,
} from "@prisma/client";

import { prisma } from "../src/lib/prisma";

import {
  extractProductStyleCode,
  normalizeBrandKey,
  normalizeGtin,
  normalizeIdentifierValue,
} from "../src/lib/catalog/normalize";

type CliOptions = {
  siteId: string | null;
  brand: string | null;
  dryRun: boolean;
  limit: number | null;
};

type IdentifierInput = {
  siteId: string;
  type: ProductIdentifierType;
  value: string;
  brandKey: string;
  merchantSlug: string;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    siteId: null,
    brand: null,
    dryRun: false,
    limit: null,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith("--site=")) {
      options.siteId = arg.replace("--site=", "").trim();
      continue;
    }

    if (arg.startsWith("--brand=")) {
      options.brand = arg.replace("--brand=", "").trim();
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const value = Number(arg.replace("--limit=", "").trim());
      if (Number.isInteger(value) && value > 0) {
        options.limit = value;
      }
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log("");
  console.log("============================================================");
  console.log("Backfill ProductIdentifier");
  console.log("============================================================");
  console.log(`Site   : ${options.siteId ?? "tous"}`);
  console.log(`Marque : ${options.brand ?? "toutes"}`);
  console.log(`Mode   : ${options.dryRun ? "dry-run" : "écriture"}`);
  console.log("============================================================");
  console.log("");

  const products = await prisma.product.findMany({
    where: {
      ...(options.brand
        ? {
            brand: {
              contains: options.brand,
              mode: "insensitive",
            },
          }
        : {}),
      ...(options.siteId
        ? {
            sites: {
              some: {
                siteId: options.siteId,
              },
            },
          }
        : {}),
    },
    orderBy: {
      id: "asc",
    },
    take: options.limit ?? undefined,
    select: {
      id: true,
      brand: true,
      gtin: true,
      manufacturerReference: true,
      attributes: true,
      sites: {
        select: {
          siteId: true,
        },
      },
      offers: {
        select: {
          externalId: true,
          parentExternalId: true,
          feedKey: true,
          merchant: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  });

  let identifiersSeen = 0;
  let identifiersWritten = 0;
  let productsWithIdentifiers = 0;

  for (const product of products) {
    const productSiteIds = unique([
      ...product.sites.map((site) => site.siteId),
      ...product.offers
        .map((offer) => offer.feedKey?.split(":")[0])
        .filter((value): value is string => Boolean(value)),
    ]).filter((siteId) => !options.siteId || siteId === options.siteId);

    const identifiers = buildIdentifiersForProduct(
      productSiteIds,
      product.brand ?? undefined,
      product.gtin ?? undefined,
      product.manufacturerReference ?? undefined,
      product.attributes,
      product.offers
    );

    if (identifiers.length === 0) {
      continue;
    }

    productsWithIdentifiers += 1;
    identifiersSeen += identifiers.length;

    if (options.dryRun) {
      continue;
    }

    for (const identifier of identifiers) {
      await prisma.productIdentifier.upsert({
        where: {
          siteId_type_value_brandKey_merchantSlug: {
            siteId: identifier.siteId,
            type: identifier.type,
            value: identifier.value,
            brandKey: identifier.brandKey,
            merchantSlug: identifier.merchantSlug,
          },
        },
        update: {
          productId: product.id,
        },
        create: {
          productId: product.id,
          siteId: identifier.siteId,
          type: identifier.type,
          value: identifier.value,
          brandKey: identifier.brandKey,
          merchantSlug: identifier.merchantSlug,
        },
      });

      identifiersWritten += 1;
    }
  }

  console.table([
    {
      metric: "Produits analysés",
      value: products.length,
    },
    {
      metric: "Produits avec identifiants",
      value: productsWithIdentifiers,
    },
    {
      metric: "Identifiants détectés",
      value: identifiersSeen,
    },
    {
      metric: "Identifiants écrits",
      value: identifiersWritten,
    },
  ]);

  console.log("");

  await prisma.$disconnect();
}

function buildIdentifiersForProduct(
  siteIds: string[],
  brand: string | undefined,
  productGtin: string | undefined,
  productManufacturerReference: string | undefined,
  attributes: unknown,
  offers: Array<{
    externalId: string | null;
    parentExternalId: string | null;
    feedKey: string | null;
    merchant: {
      slug: string;
    };
  }>
): IdentifierInput[] {
  const identifiers = new Map<string, IdentifierInput>();
  const brandKey = normalizeBrandKey(brand);
  const attrs = asRecord(attributes);

  const add = (
    siteId: string,
    type: ProductIdentifierType,
    rawValue: string | null | undefined,
    options?: {
      brandKey?: string;
      merchantSlug?: string;
    }
  ) => {
    const value =
      type === ProductIdentifierType.GTIN
        ? normalizeGtin(rawValue)
        : normalizeIdentifierValue(rawValue);

    if (!value) {
      return;
    }

    const normalizedBrandKey = options?.brandKey ?? "";
    const normalizedMerchantSlug = options?.merchantSlug ?? "";

    const key = [
      siteId,
      type,
      value,
      normalizedBrandKey,
      normalizedMerchantSlug,
    ].join("|");

    identifiers.set(key, {
      siteId,
      type,
      value,
      brandKey: normalizedBrandKey,
      merchantSlug: normalizedMerchantSlug,
    });
  };

  for (const siteId of siteIds) {
    add(siteId, ProductIdentifierType.GTIN, productGtin);

    for (const gtin of arrayFromUnknown(attrs.variantGtins)) {
      add(siteId, ProductIdentifierType.GTIN, gtin);
    }

    if (brandKey) {
      add(
        siteId,
        ProductIdentifierType.MANUFACTURER_REFERENCE,
        productManufacturerReference,
        { brandKey }
      );

      for (const reference of arrayFromUnknown(attrs.manufacturerReferences)) {
        add(
          siteId,
          ProductIdentifierType.MANUFACTURER_REFERENCE,
          reference,
          { brandKey }
        );
      }

      for (const styleCode of [
        extractProductStyleCode(productManufacturerReference),
        ...arrayFromUnknown(attrs.styleCodes),
      ]) {
        add(siteId, ProductIdentifierType.STYLE_CODE, styleCode, {
          brandKey,
        });
      }
    }

    for (const offer of offers) {
      add(
        siteId,
        ProductIdentifierType.MERCHANT_PARENT_ID,
        offer.parentExternalId,
        { merchantSlug: offer.merchant.slug }
      );

      const styleCodeFromParent = extractProductStyleCode(
        offer.parentExternalId
      );

      if (brandKey && styleCodeFromParent) {
        add(siteId, ProductIdentifierType.STYLE_CODE, styleCodeFromParent, {
          brandKey,
        });
      }

	  const sourceGroupKey = normalizeIdentifierValue(
	    typeof attrs.sourceGroupKey === "string"
	      ? attrs.sourceGroupKey
		  : undefined
	  );

      if (sourceGroupKey) {
        add(siteId, ProductIdentifierType.SOURCE_GROUP_KEY, sourceGroupKey, {
          merchantSlug: offer.merchant.slug,
        });
      }
    }

    for (const parentExternalId of arrayFromUnknown(
      attrs.merchantParentExternalIds
    )) {
      for (const offer of offers) {
        add(
          siteId,
          ProductIdentifierType.MERCHANT_PARENT_ID,
          parentExternalId,
          { merchantSlug: offer.merchant.slug }
        );
      }
    }
  }

  return Array.from(identifiers.values());
}

function asRecord(value: unknown): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function arrayFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) =>
      typeof entry === "string" ? entry : String(entry ?? "")
    )
    .filter(Boolean);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

main().catch(async (error) => {
  console.error("");
  console.error("Erreur backfill ProductIdentifier :");
  console.error(error);
  console.error("");

  await prisma.$disconnect();
  process.exit(1);
});
