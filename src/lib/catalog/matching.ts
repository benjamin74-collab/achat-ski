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
