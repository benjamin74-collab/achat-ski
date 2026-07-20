import type { PrismaClient } from "@prisma/client";
import type {
  MatchingResult,
  NormalizedFeedItem,
} from "./feed-types";

import {
  normalizeProductName,
  normalizeVariant,
} from "./normalize";

/**
 * Moteur de matching.
 *
 * Il détermine si une ligne du flux correspond
 * à un produit déjà existant.
 *
 * Il ne crée rien.
 * Il ne modifie rien.
 * Il ne fait que rechercher.
 */
export async function matchFeedItem(
  prisma: PrismaClient,
  item: NormalizedFeedItem
): Promise<MatchingResult> {

  //
  // 1. Recherche par EAN
  //
  if (item.ean) {

    const sku = await prisma.sku.findUnique({
      where: {
        gtin: item.ean,
      },
      include: {
        product: true,
      },
    });

    if (sku) {
      return {
        productId: sku.productId,
        skuId: sku.id,
        confidence: 100,
        reason: "EAN",
      };
    }
  }

  //
  // 2. Marque + référence fabricant + taille
  //
  if (item.brand && item.manufacturerReference) {

    const sku = await prisma.sku.findFirst({

      where: {

        manufacturerReference:
          item.manufacturerReference,

        size:
          item.size,

        product: {
          Brand: {
            name: item.brand,
          },
        },
      },

      include: {
        product: true,
      },
    });

    if (sku) {

      return {

        productId: sku.productId,

        skuId: sku.id,

        confidence: 99,

        reason:
          "BRAND_MANUFACTURER_REFERENCE_SIZE",
      };
    }
  }

  //
  // 3. Marque + référence fabricant
  //
  if (item.brand && item.manufacturerReference) {

    const product =
      await prisma.product.findFirst({

        where: {

          manufacturerReference:
            item.manufacturerReference,

          Brand: {

            name: item.brand,
          },
        },
      });

    if (product) {

      return {

        productId: product.id,

        confidence: 97,

        reason:
          "BRAND_MANUFACTURER_REFERENCE",
      };
    }
  }

  //
  // 4. Marque + nom normalisé
  //
  if (item.brand) {

    const normalizedName =
      normalizeProductName(
        item.cleanName ?? item.title
      );

    const product =
      await prisma.product.findFirst({

        where: {

          normalizedName,

          Brand: {
            name: item.brand,
          },
        },
      });

    if (product) {

      const variant =
        normalizeVariant(item);

      if (variant) {

        const sku =
          await prisma.sku.findFirst({

            where: {

              productId: product.id,

              normalizedVariant:
                variant,
            },
          });

        if (sku) {

          return {

            productId: product.id,

            skuId: sku.id,

            confidence: 92,

            reason:
              "BRAND_NORMALIZED_NAME_VARIANT",
          };
        }
      }

      return {

        productId: product.id,

        confidence: 85,

        reason:
          "BRAND_NORMALIZED_NAME",
      };
    }
  }

  //
  // Aucun match
  //
  return {

    confidence: 0,

    reason: "NEW_PRODUCT",
  };
}