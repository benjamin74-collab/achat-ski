import {
  ProductIdentifierType,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";

import type {
  AggregatedFeedItem,
  MatchingResult,
} from "./feed-types";

import {
  extractProductStyleCode,
  normalizeBrandKey,
  normalizeGtin,
  normalizeIdentifierValue,
  normalizeProductName,
  normalizeText,
} from "./normalize";

export async function matchFeedItem(
  prisma: PrismaClient,
  aggregated: AggregatedFeedItem,
  merchantId: number,
  siteId: string,
  brandId?: number,
  brandName?: string
): Promise<MatchingResult> {
  const item = aggregated.item;

  const brandKey = normalizeBrandKey(
    brandName || item.brand
  );
  
  const incomingProductKind =
  resolveGuardedProductKind(
    aggregated
  );

const sourceGroupKeys = uniqueIdentifiers([
  ...aggregated.sourceGroupKeys,
  aggregated.groupKey,
]);

if (sourceGroupKeys.length > 0) {
  const productFromSourceGroup =
    await findCompatibleProductByIdentifier(
      prisma,
      siteId,
      ProductIdentifierType.SOURCE_GROUP_KEY,
      sourceGroupKeys,
      "",
      item.merchantSlug,
      aggregated
    );

  if (productFromSourceGroup) {
    return {
      productId:
        productFromSourceGroup.productId,
      confidence: 100,
      reason: "MERCHANT_PARENT_EXTERNAL_ID",
    };
  }
}

/*
 * Les packs snowboard sont des produits composites.
 * Ils ne doivent jamais matcher une planche nue via GTIN,
 * référence fabricant, style code ou nom normalisé.
 */
if (
  incomingProductKind === "SNOWBOARD_PACK" ||
  incomingProductKind === "NORDIC_PACK"
) {
  return {
    confidence: 0,
    reason: "NEW_PRODUCT",
  };
}

  const gtins = uniqueIdentifiers(
    [
      ...aggregated.variantGtins,
      item.gtin,
    ].map((value) => normalizeGtin(value))
  );

  if (gtins.length > 0) {
    const productFromIdentifier =
      await findProductByIdentifier(
        prisma,
        siteId,
        ProductIdentifierType.GTIN,
        gtins,
        "",
        ""
      );

    if (productFromIdentifier) {
      return {
        productId: productFromIdentifier.productId,
        confidence: 100,
        reason: "GTIN",
      };
    }

    const product = await prisma.product.findFirst({
      where: {
        gtin: {
          in: gtins,
        },
      },
      select: {
        id: true,
      },
    });

    if (product) {
      return {
        productId: product.id,
        confidence: 100,
        reason: "GTIN",
      };
    }
  }

  const merchantParentExternalIds = uniqueIdentifiers([
    ...aggregated.merchantParentExternalIds,
    item.parentExternalId,
  ]);

  if (merchantParentExternalIds.length > 0) {
    const productFromIdentifier =
      await findProductByIdentifier(
        prisma,
        siteId,
        ProductIdentifierType.MERCHANT_PARENT_ID,
        merchantParentExternalIds,
        "",
        item.merchantSlug
      );

    if (productFromIdentifier) {
      return {
        productId: productFromIdentifier.productId,
        confidence: 100,
        reason: "MERCHANT_PARENT_EXTERNAL_ID",
      };
    }

    const offer = await prisma.offer.findFirst({
      where: {
        merchantId,
        parentExternalId: {
          in: merchantParentExternalIds,
        },
      },
      select: {
        productId: true,
      },
    });

    if (offer) {
      return {
        productId: offer.productId,
        confidence: 100,
        reason: "MERCHANT_PARENT_EXTERNAL_ID",
      };
    }
  }

  const merchantExternalIds = uniqueIdentifiers([
    ...aggregated.merchantExternalIds,
    item.externalId,
  ]);

  if (merchantExternalIds.length > 0) {
    const offer = await prisma.offer.findFirst({
      where: {
        merchantId,
        externalId: {
          in: merchantExternalIds,
        },
      },
      select: {
        productId: true,
      },
    });

    if (offer) {
      return {
        productId: offer.productId,
        confidence: 99,
        reason: "MERCHANT_EXTERNAL_ID",
      };
    }
  }

  const styleCodes = uniqueIdentifiers([
    ...aggregated.styleCodes,
    extractProductStyleCode(
      item.manufacturerReference
    ),
    extractProductStyleCode(
      item.parentExternalId
    ),
  ]);

  if (brandKey && styleCodes.length > 0) {
    const productFromIdentifier =
      await findProductByIdentifier(
        prisma,
        siteId,
        ProductIdentifierType.STYLE_CODE,
        styleCodes,
        brandKey,
        ""
      );

    if (productFromIdentifier) {
      return {
        productId: productFromIdentifier.productId,
        confidence: 98,
        reason: "BRAND_STYLE_CODE",
      };
    }
  }

  const brandWhere = buildBrandWhere(
    item.brand,
    brandId
  );

  const manufacturerReferences = uniqueIdentifiers([
    ...aggregated.manufacturerReferences,
    item.manufacturerReference,
  ]);

  if (brandKey && manufacturerReferences.length > 0) {
    const productFromIdentifier =
      await findProductByIdentifier(
        prisma,
        siteId,
        ProductIdentifierType.MANUFACTURER_REFERENCE,
        manufacturerReferences,
        brandKey,
        ""
      );

    if (productFromIdentifier) {
      return {
        productId: productFromIdentifier.productId,
        confidence: 97,
        reason: "BRAND_MANUFACTURER_REFERENCE",
      };
    }
  }

  if (manufacturerReferences.length > 0) {
    const product = await prisma.product.findFirst({
      where: {
        manufacturerReference: {
          in: manufacturerReferences,
        },
        ...brandWhere,
      },
      select: {
        id: true,
      },
    });

    if (product) {
      return {
        productId: product.id,
        confidence: 97,
        reason: "BRAND_MANUFACTURER_REFERENCE",
      };
    }
  }

  /*
   * Le matching par nom est uniquement un fallback
   * lorsque le flux ne fournit AUCUN identifiant fiable.
   *
   * S'il existe un GTIN, un identifiant marchand,
   * un parent marchand, une référence fabricant ou un code modèle
   * qui n'a trouvé aucune correspondance, cela signifie normalement
   * que nous sommes face à un nouveau produit.
   */
  const hasStrongIdentifier =
    gtins.length > 0 ||
    merchantParentExternalIds.length > 0 ||
    merchantExternalIds.length > 0 ||
    manufacturerReferences.length > 0 ||
    styleCodes.length > 0;

  if (!hasStrongIdentifier) {
    const normalizedName = normalizeProductName(
      item.cleanName ?? item.title
    );

    if (normalizedName) {
      const product = await prisma.product.findFirst({
        where: {
          normalizedName,
          ...brandWhere,
        },
        select: {
          id: true,
        },
      });

      if (product) {
        return {
          productId: product.id,
          confidence: 90,
          reason: "BRAND_NORMALIZED_NAME",
        };
      }
    }
  }

  return {
    confidence: 0,
    reason: "NEW_PRODUCT",
  };
}

async function findProductByIdentifier(
  prisma: PrismaClient,
  siteId: string,
  type: ProductIdentifierType,
  values: string[],
  brandKey: string,
  merchantSlug: string
): Promise<{ productId: number } | null> {
  const cleanedValues = uniqueIdentifiers(values);

  if (cleanedValues.length === 0) {
    return null;
  }

  return prisma.productIdentifier.findFirst({
    where: {
      siteId,
      type,
      value: {
        in: cleanedValues,
      },
      brandKey,
      merchantSlug,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      productId: true,
    },
  });
}

function buildBrandWhere(
  brand: string | undefined,
  brandId: number | undefined
): Prisma.ProductWhereInput {
  if (brandId) return { brandId };

  if (brand) {
    return {
      brand: {
        equals: brand,
        mode: "insensitive",
      },
    };
  }

  return {};
}

function uniqueIdentifiers(
  values: Array<string | null | undefined>
): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeIdentifierValue(value))
        .filter((value): value is string => Boolean(value))
    )
  );
}

type GuardedProductKind =
  | "SNOWBOARD_PACK"
  | "SNOWBOARD_BOARD"
  | "SNOWBOARD_SPLITBOARD"
  | "SNOWBOARD_BOOT"
  | "SNOWBOARD_BINDING"
  | "SNOWBOARD_BAG"
  | "NORDIC_PACK"
  | "NORDIC_SKI"
  | "NORDIC_BOOT"
  | "NORDIC_BINDING"
  | "NORDIC_MAINTENANCE"
  | "NORDIC_POLE";

async function findCompatibleProductByIdentifier(
  prisma: PrismaClient,
  siteId: string,
  type: ProductIdentifierType,
  values: string[],
  brandKey: string,
  merchantSlug: string,
  aggregated: AggregatedFeedItem
): Promise<{ productId: number } | null> {
  const candidate =
    await findProductByIdentifier(
      prisma,
      siteId,
      type,
      values,
      brandKey,
      merchantSlug
    );

  if (!candidate) {
    return null;
  }

  const compatible =
    await isCompatibleExistingProduct(
      prisma,
      candidate.productId,
      aggregated
    );

  if (!compatible) {
    return null;
  }

  return candidate;
}

async function isCompatibleExistingProduct(
  prisma: PrismaClient,
  productId: number,
  aggregated: AggregatedFeedItem
): Promise<boolean> {
  const incomingKind =
    resolveGuardedProductKind(
      aggregated
    );

  if (!incomingKind) {
    return true;
  }

  const product =
    await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        categoryId: true,
        attributes: true,
      },
    });

  if (!product) {
    return false;
  }

  const category =
    product.categoryId
      ? await prisma.category.findUnique({
          where: {
            id: product.categoryId,
          },
          select: {
            slug: true,
          },
        })
      : null;

  const existingPath =
    readJsonStringAttribute(
      product.attributes,
      "sourceCategoryPath"
    );

  const existingKind =
    resolveProductKindFromSlug(
      category?.slug
    ) ||
    resolveProductKindFromPath(
      existingPath
    );

  if (!existingKind) {
    return true;
  }

  return existingKind === incomingKind;
}

function resolveGuardedProductKind(
  aggregated: AggregatedFeedItem
): GuardedProductKind | null {
  return (
    resolveProductKindFromPath(
      aggregated.item.categoryPath
    ) ||
    resolveProductKindFromSlug(
      aggregated.primaryCategory.slug
    )
  );
}

function resolveProductKindFromSlug(
  slug: string | null | undefined
): GuardedProductKind | null {
  switch (slug) {
    case "packs-snowboard":
      return "SNOWBOARD_PACK";

    case "planches-snowboard":
    case "snowboard-freestyle":
    case "snowboard-all-mountain":
    case "snowboard-freeride":
      return "SNOWBOARD_BOARD";

    case "splitboard":
      return "SNOWBOARD_SPLITBOARD";

    case "boots-snowboard":
    case "boots-snowboard-freestyle":
    case "boots-snowboard-freeride":
      return "SNOWBOARD_BOOT";

    case "fixations-snowboard":
    case "fixations-snowboard-straps":
    case "fixations-snowboard-rear-entry":
    case "fixations-splitboard":
      return "SNOWBOARD_BINDING";

    case "housses-snowboard":
      return "SNOWBOARD_BAG";
	  
	case "packs-skating":
	case "packs-ski-classique":
	  return "NORDIC_PACK";

	case "skis-skating":
	case "skis-classique":
	  return "NORDIC_SKI";

	case "chaussures-skating":
	case "chaussures-classique":
	  return "NORDIC_BOOT";

	case "fixations-skating":
	case "fixations-classique":
	  return "NORDIC_BINDING";

	case "entretien-ski-nordique":
	case "fart-glisse":
	case "fart-retenue":
	case "outils-fartage":
	  return "NORDIC_MAINTENANCE";

    default:
      return null;
  }
}

function resolveProductKindFromPath(
  value: string | null | undefined
): GuardedProductKind | null {
  const path =
    normalizeCategoryPath(value);

  if (path.includes("snowboard")) {
    if (
      path.includes("pack snowboard") ||
      path.includes("snowboard > packs")
    ) {
      return "SNOWBOARD_PACK";
    }

    if (
      path.includes("planche de snowboard") ||
      path.includes("snowboard > planches")
    ) {
      return "SNOWBOARD_BOARD";
    }

    if (
      path.includes("splitboard")
    ) {
      return "SNOWBOARD_SPLITBOARD";
    }

    if (
      path.includes("boots snowboard") ||
      path.includes("snowboard > boots")
    ) {
      return "SNOWBOARD_BOOT";
    }

    if (
      path.includes("fixation snowboard") ||
      path.includes("fixations snowboard") ||
      path.includes("snowboard > fixations")
    ) {
      return "SNOWBOARD_BINDING";
    }

    if (
      path.includes("housse snowboard") ||
      path.includes("bagagerie snowboard")
    ) {
      return "SNOWBOARD_BAG";
    }
  }

  if (
    path.includes("ski de fond")
  ) {
    if (
      path.includes("pack ski de fond")
    ) {
      return "NORDIC_PACK";
    }

    if (
      path.includes("chaussure ski de fond")
    ) {
      return "NORDIC_BOOT";
    }

    if (
      path.includes("fixation ski de fond")
    ) {
      return "NORDIC_BINDING";
    }

    if (
      path.includes("ski de fond > materiel ski de fond > ski de fond") ||
      path.includes("materiel ski de fond > ski de fond")
    ) {
      return "NORDIC_SKI";
    }

    if (
      path.includes("fart ski de fond") ||
      path.includes("brosse a farter") ||
      path.includes("outil de fartage")
    ) {
      return "NORDIC_MAINTENANCE";
    }

    if (
      path.includes("baton ski de fond")
    ) {
      return "NORDIC_POLE";
    }
  }

  return null;
}

function readJsonStringAttribute(
  attributes: Prisma.JsonValue | null | undefined,
  key: string
): string {
  if (
    !attributes ||
    typeof attributes !== "object" ||
    Array.isArray(attributes)
  ) {
    return "";
  }

  const value =
    (
      attributes as Record<
        string,
        unknown
      >
    )[key];

  return typeof value === "string"
    ? value
    : "";
}

function normalizeCategoryPath(
  value: string | null | undefined
): string {
  return normalizeText(value)
    .toLowerCase()
    .replace(
      /\s*(>|\/|\||»|→)\s*/g,
      " > "
    )
    .replace(/\s+/g, " ")
    .trim();
}