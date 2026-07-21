import type { Prisma, PrismaClient } from "@prisma/client";
import type {
  MatchingResult,
  NormalizedFeedItem,
} from "./feed-types";
import { normalizeProductName } from "./normalize";

export async function matchFeedItem(
  prisma: PrismaClient,
  item: NormalizedFeedItem,
  merchantId: number,
  brandId?: number
): Promise<MatchingResult> {
  if (item.parentExternalId) {
    const offer = await prisma.offer.findFirst({
      where: {
        merchantId,
        parentExternalId: item.parentExternalId,
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

  if (item.externalId) {
    const offer = await prisma.offer.findFirst({
      where: {
        merchantId,
        externalId: item.externalId,
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

  const brandWhere = buildBrandWhere(item.brand, brandId);

  if (item.manufacturerReference) {
    const product = await prisma.product.findFirst({
      where: {
        manufacturerReference: item.manufacturerReference,
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

  return {
    confidence: 0,
    reason: "NEW_PRODUCT",
  };
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
