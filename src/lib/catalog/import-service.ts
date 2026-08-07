import {
  Prisma,
  ProductIdentifierType,
  type Merchant,
  type PrismaClient,
} from "@prisma/client";

import type {
  AggregatedFeedItem,
  ImportStats,
  NormalizedFeedItem,
} from "./feed-types";

import { matchFeedItem } from "./matching";

import {
  buildProductSlug,
  extractProductStyleCode,
  formatBrandDisplayName,
  normalizeBrandKey,
  normalizeGtin,
  normalizeIdentifierValue,
  normalizeProductName,
  slugify,
  toPriceCents,
} from "./normalize";

type ResolvedBrand = {
  id: number;
  name: string;
};

type BrandCache = Map<
  string,
  ResolvedBrand
>;

export async function upsertFeedMerchant(
  prisma: PrismaClient,
  item: NormalizedFeedItem
): Promise<Merchant> {
  return prisma.merchant.upsert({
    where: {
      slug: item.merchantSlug,
    },
    update: {
      active: true,
      status: "active",
      network:
        item.merchantPlatform.toLowerCase(),
      platform: item.merchantPlatform,
    },
    create: {
      name: merchantNameFromSlug(
        item.merchantSlug
      ),
      slug: item.merchantSlug,
      network:
        item.merchantPlatform.toLowerCase(),
      platform: item.merchantPlatform,
      status: "active",
      active: true,
    },
  });
}

export async function importAggregatedFeedItem(
  prisma: PrismaClient,
  aggregated: AggregatedFeedItem,
  merchant: Merchant,
  feedKey: string,
  siteId: string,
  seenAt: Date,
  stats: ImportStats,
  brandCache: BrandCache
) {
  const {
    item,
    primaryCategory,
    categories,
  } = aggregated;

const resolvedBrand =
  await upsertBrand(
    prisma,
    item,
    brandCache
  );

const brandId =
  resolvedBrand?.id;

const brandName =
  resolvedBrand?.name;

  const match = await matchFeedItem(
    prisma,
    aggregated,
    merchant.id,
    siteId,
    brandId,
    brandName
  );

const product = match.productId
  ? await updateMatchedProduct(
      prisma,
      aggregated,
      match.productId,
      brandId,
      brandName,
      stats
    )
  : await createProduct(
      prisma,
      aggregated,
      brandId,
      brandName,
      stats
    );

  await syncProductCategories(
    prisma,
    product.id,
    primaryCategory.id,
    categories.map((category) => category.id)
  );

  await syncProductIdentifiers(
    prisma,
    product.id,
    siteId,
    merchant.slug,
    brandName || item.brand,
    aggregated
  );

  const offer = await upsertOffer(
    prisma,
    aggregated,
    merchant.id,
    product.id,
    feedKey,
    seenAt,
    stats
  );

  return {
    product,
    offer,
    match,
    primaryCategory,
    categories,
  };
}

async function upsertBrand(
  prisma: PrismaClient,
  item: NormalizedFeedItem,
  cache: BrandCache
): Promise<ResolvedBrand | undefined> {
  if (!item.brand) {
    return undefined;
  }

  const brandKey =
    normalizeBrandKey(item.brand);

  if (!brandKey) {
    return undefined;
  }

  /*
   * Le cache utilise la clé normalisée et non le slug.
   */
  const cached =
    cache.get(brandKey);

  if (cached) {
    return cached;
  }

  /*
   * Recherche dans le référentiel existant.
   *
   * On préfère parcourir les marques existantes plutôt
   * que de créer une marque sur la seule base du slug.
   *
   * Le nombre de marques est faible par rapport au
   * nombre de produits d'un flux.
   */
  const existingBrands =
    await prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        active: true,
      },
    });

  const existingBrand =
    existingBrands.find(
      (brand) =>
        normalizeBrandKey(
          brand.name
        ) === brandKey
    );

  if (existingBrand) {
    /*
     * IMPORTANT :
     *
     * On ne modifie JAMAIS le nom officiel d'une
     * marque à partir d'un flux marchand.
     */
    if (!existingBrand.active) {
      await prisma.brand.update({
        where: {
          id: existingBrand.id,
        },
        data: {
          active: true,
        },
      });
    }

    const resolved: ResolvedBrand = {
      id: existingBrand.id,
      name: existingBrand.name,
    };

    cache.set(
      brandKey,
      resolved
    );

    return resolved;
  }

  /*
   * Aucune marque existante trouvée :
   * on peut réellement créer une nouvelle marque.
   */
  const displayName =
    formatBrandDisplayName(
      item.brand
    );

  if (!displayName) {
    return undefined;
  }

  let brandSlug =
    slugify(displayName);

  if (!brandSlug) {
    brandSlug = `brand-${Date.now()}`;
  }

  /*
   * Sécurité en cas de collision de slug avec
   * une marque qui aurait un autre nom normalisé.
   */
  let finalSlug = brandSlug;
  let suffix = 2;

  while (
    await prisma.brand.findUnique({
      where: {
        slug: finalSlug,
      },
      select: {
        id: true,
      },
    })
  ) {
    finalSlug =
      `${brandSlug}-${suffix}`;

    suffix += 1;
  }

  const brand =
    await prisma.brand.create({
      data: {
        name: displayName,
        slug: finalSlug,
        active: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

  const resolved: ResolvedBrand = {
    id: brand.id,
    name: brand.name,
  };

  cache.set(
    brandKey,
    resolved
  );

  return resolved;
}

async function updateMatchedProduct(
  prisma: PrismaClient,
  aggregated: AggregatedFeedItem,
  productId: number,
  brandId: number | undefined,
  brandName: string | undefined,
  stats: ImportStats
) {
  const {
    item,
    primaryCategory,
  } = aggregated;

  const name =
    item.cleanName || item.title;

  const normalizedName =
    normalizeProductName(name);
	
  const gtin = normalizeGtin(
    item.gtin
  );

  const writableLegacyGtin =
    await resolveWritableLegacyGtin(
      prisma,
      productId,
      gtin
    );

  const product = await prisma.product.update({
    where: {
      id: productId,
    },
    data: {
      name,
      model: name,
	  brand:
	    brandName ||
	    formatBrandDisplayName(
		  item.brand
	    ),
	  brandId,
	  gtin: writableLegacyGtin,

      categoryId: primaryCategory.id,

      description:
        item.description || undefined,

      normalizedName,

      manufacturerReference:
        item.manufacturerReference ||
        undefined,

      /*
       * Une URL vide ou absente ne doit pas effacer
       * une image déjà enregistrée.
       */
      imageUrl:
        item.imageUrl || undefined,

      active: true,
      published: true,

      attributes:
        buildProductAttributes(
          aggregated
        ),
    },
  });

  stats.updatedProducts += 1;

  return product;
}

async function createProduct(
  prisma: PrismaClient,
  aggregated: AggregatedFeedItem,
  brandId: number | undefined,
  brandName: string | undefined,
  stats: ImportStats
) {
  const {
    item,
    primaryCategory,
  } = aggregated;

  const name =
    item.cleanName || item.title;

  const normalizedName =
    normalizeProductName(name);

  const baseSlug =
    buildProductSlug(item) ||
    "produit";

  const gtin =
    normalizeGtin(item.gtin);

  const writableLegacyGtin =
    await resolveWritableLegacyGtin(
      prisma,
      undefined,
      gtin
    );

  const productData = {
    name,
    model: name,

    brand:
      brandName ||
      formatBrandDisplayName(
        item.brand
      ),

    brandId,
    gtin: writableLegacyGtin,

    categoryId:
      primaryCategory.id,

    description:
      item.description,

    normalizedName,

    manufacturerReference:
      item.manufacturerReference,

    imageUrl:
      item.imageUrl,

    published:
      true,

    active:
      true,

    attributes:
      buildProductAttributes(
        aggregated
      ),
  };

  /*
   * La recherche préalable d'un slug libre ne suffit
   * pas lorsque plusieurs produits sont créés en parallèle.
   *
   * On tente donc la création et, en cas de collision P2002
   * sur le slug, on recommence avec un suffixe.
   */
  for (
    let attempt = 1;
    attempt <= 20;
    attempt += 1
  ) {
    const slug =
      attempt === 1
        ? baseSlug
        : `${baseSlug}-${attempt}`;

    try {
      const product =
        await prisma.product.create({
          data: {
            ...productData,
            slug,
          },
        });

      stats.createdProducts += 1;

      return product;
    } catch (error) {
      const isSlugCollision =
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        isUniqueConstraintField(
          error.meta?.target,
          "slug"
        );

      if (!isSlugCollision) {
        throw error;
      }
    }
  }

  /*
   * Sécurité exceptionnelle si plus de 20 produits
   * produisent exactement la même base de slug.
   */
  const fallbackSlug = [
    baseSlug,
    item.manufacturerReference,
    item.gtin,
    item.externalId,
    Date.now(),
  ]
    .filter(Boolean)
    .map((value) =>
      slugify(String(value))
    )
    .filter(Boolean)
    .join("-")
    .slice(0, 180);

  const product =
    await prisma.product.create({
      data: {
        ...productData,
        slug:
          fallbackSlug ||
          `produit-${Date.now()}`,
      },
    });

  stats.createdProducts += 1;

  return product;
}

/**
 * Enregistre la catégorie principale ainsi que toutes
 * les catégories secondaires du produit.
 *
 * Les anciennes relations ne sont pas supprimées brutalement :
 * un même produit peut être enrichi par plusieurs marchands.
 */
async function syncProductCategories(
  prisma: PrismaClient,
  productId: number,
  primaryCategoryId: number,
  categoryIds: number[]
) {
  const uniqueCategoryIds = Array.from(
    new Set([
      primaryCategoryId,
      ...categoryIds,
    ])
  );

  /*
   * Une seule relation doit porter isPrimary=true.
   */
  await prisma.productCategory.updateMany({
    where: {
      productId,
      isPrimary: true,
    },
    data: {
      isPrimary: false,
    },
  });

  for (const categoryId of uniqueCategoryIds) {
    await prisma.productCategory.upsert({
      where: {
        productId_categoryId: {
          productId,
          categoryId,
        },
      },
      update: {
        isPrimary:
          categoryId ===
          primaryCategoryId,
      },
      create: {
        productId,
        categoryId,
        isPrimary:
          categoryId ===
          primaryCategoryId,
      },
    });
  }
}

async function upsertOffer(
  prisma: PrismaClient,
  aggregated: AggregatedFeedItem,
  merchantId: number,
  productId: number,
  feedKey: string,
  seenAt: Date,
  stats: ImportStats
) {
  const {
    item,
    sourceItemCount,
  } = aggregated;

  const priceCents =
    toPriceCents(item.price);

  const oldPriceCents =
    item.oldPrice !== undefined
      ? toPriceCents(item.oldPrice)
      : null;

  const shippingCents =
    item.shippingCost !== undefined
      ? toPriceCents(
          item.shippingCost
        )
      : null;

  const existingOffer =
    await prisma.offer.findUnique({
      where: {
        productId_merchantId: {
          productId,
          merchantId,
        },
      },
    });

  if (existingOffer) {
    const priceChanged =
      existingOffer.priceCents !==
        priceCents ||
      existingOffer.oldPriceCents !==
        oldPriceCents ||
      existingOffer.shippingCents !==
        shippingCents ||
      existingOffer.inStock !==
        item.inStock;

    const offer =
      await prisma.offer.update({
        where: {
          id: existingOffer.id,
        },
        data: {
          affiliateUrl:
            item.affiliateUrl,

          priceCents,
          oldPriceCents,
          shippingCents,

          currency: item.currency,
          inStock: item.inStock,
          availability:
            item.availability,

          externalId:
            item.externalId ?? null,

          parentExternalId:
            item.parentExternalId ??
            null,

          merchantProductUrl:
            item.merchantProductUrl ??
            null,

          imageUrl:
            item.imageUrl ||
            existingOffer.imageUrl,

          active: true,
          feedKey,
          sourceItemCount,
          lastSeen: seenAt,
        },
      });

    stats.updatedOffers += 1;

    if (priceChanged) {
      await createPriceHistory(
        prisma,
        offer.id,
        item,
        priceCents,
        oldPriceCents,
        shippingCents
      );
    }

    return offer;
  }

  const offer = await prisma.offer.create({
    data: {
      productId,
      merchantId,

      affiliateUrl:
        item.affiliateUrl,

      priceCents,
      oldPriceCents,
      shippingCents,

      currency: item.currency,
      inStock: item.inStock,
      availability:
        item.availability,

      externalId:
        item.externalId,

      parentExternalId:
        item.parentExternalId,

      merchantProductUrl:
        item.merchantProductUrl,

      imageUrl:
        item.imageUrl,

      active: true,
      feedKey,
      sourceItemCount,
      lastSeen: seenAt,
    },
  });

  await createPriceHistory(
    prisma,
    offer.id,
    item,
    priceCents,
    oldPriceCents,
    shippingCents
  );

  stats.createdOffers += 1;

  return offer;
}

async function createPriceHistory(
  prisma: PrismaClient,
  offerId: number,
  item: NormalizedFeedItem,
  priceCents: number,
  oldPriceCents: number | null,
  shippingCents: number | null
) {
  await prisma.priceHistory.create({
    data: {
      offerId,
      priceCents,
      oldPriceCents,
      shippingCents,
      currency: item.currency,
      inStock: item.inStock,
    },
  });
}

function buildProductAttributes(
  aggregated: AggregatedFeedItem
): Prisma.InputJsonValue {
  return {
    sourceCategoryPath:
      aggregated.item.categoryPath ??
      null,

    primaryCategorySlug:
      aggregated.primaryCategory.slug,

    categorySlugs:
      aggregated.categories.map(
        (category) => category.slug
      ),

    availableSizes:
      aggregated.availableSizes,

    availableColors:
      aggregated.availableColors,

    availableGenders:
      aggregated.availableGenders,

    sourceItemCount:
      aggregated.sourceItemCount,

    sourceGroupKey:
      aggregated.groupKey,

    variantGtins:
      aggregated.variantGtins,

    manufacturerReferences:
      aggregated.manufacturerReferences,

    styleCodes:
      aggregated.styleCodes,

    merchantExternalIds:
      aggregated.merchantExternalIds,

    merchantParentExternalIds:
      aggregated.merchantParentExternalIds,
  };
}


type ProductIdentifierInput = {
  type: ProductIdentifierType;
  value: string;
  brandKey: string;
  merchantSlug: string;
};

async function syncProductIdentifiers(
  prisma: PrismaClient,
  productId: number,
  siteId: string,
  merchantSlug: string,
  brandName: string | undefined,
  aggregated: AggregatedFeedItem
): Promise<void> {
  const identifiers =
    buildProductIdentifierInputs(
      siteId,
      merchantSlug,
      brandName,
      aggregated
    );

  for (const identifier of identifiers) {
    await prisma.productIdentifier.upsert({
      where: {
        siteId_type_value_brandKey_merchantSlug: {
          siteId,
          type: identifier.type,
          value: identifier.value,
          brandKey: identifier.brandKey,
          merchantSlug: identifier.merchantSlug,
        },
      },
      update: {
        productId,
      },
      create: {
        productId,
        siteId,
        type: identifier.type,
        value: identifier.value,
        brandKey: identifier.brandKey,
        merchantSlug: identifier.merchantSlug,
      },
    });
  }
}

function buildProductIdentifierInputs(
  siteId: string,
  merchantSlug: string,
  brandName: string | undefined,
  aggregated: AggregatedFeedItem
): ProductIdentifierInput[] {
  const item = aggregated.item;
  const brandKey = normalizeBrandKey(
    brandName || item.brand
  );

  const identifiers = new Map<
    string,
    ProductIdentifierInput
  >();

  const addIdentifier = (
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

    const normalizedBrandKey =
      options?.brandKey ?? "";

    const normalizedMerchantSlug =
      options?.merchantSlug ?? "";

    const key = [
      type,
      value,
      normalizedBrandKey,
      normalizedMerchantSlug,
    ].join("|");

    identifiers.set(key, {
      type,
      value,
      brandKey: normalizedBrandKey,
      merchantSlug: normalizedMerchantSlug,
    });
  };

  for (const gtin of [
    ...aggregated.variantGtins,
    item.gtin,
  ]) {
    addIdentifier(
      ProductIdentifierType.GTIN,
      gtin
    );
  }

  if (brandKey) {
    for (const styleCode of [
      ...aggregated.styleCodes,
      extractProductStyleCode(
        item.manufacturerReference
      ),
      extractProductStyleCode(
        item.parentExternalId
      ),
    ]) {
      addIdentifier(
        ProductIdentifierType.STYLE_CODE,
        styleCode,
        { brandKey }
      );
    }

    for (const manufacturerReference of [
      ...aggregated.manufacturerReferences,
      item.manufacturerReference,
    ]) {
      addIdentifier(
        ProductIdentifierType.MANUFACTURER_REFERENCE,
        manufacturerReference,
        { brandKey }
      );
    }
  }

  for (const parentExternalId of [
    ...aggregated.merchantParentExternalIds,
    item.parentExternalId,
  ]) {
    addIdentifier(
      ProductIdentifierType.MERCHANT_PARENT_ID,
      parentExternalId,
      { merchantSlug }
    );
  }

  for (const sourceGroupKey of [
    ...aggregated.sourceGroupKeys,
    aggregated.groupKey,
  ]) {
    addIdentifier(
      ProductIdentifierType.SOURCE_GROUP_KEY,
      sourceGroupKey,
      { merchantSlug }
    );
  }

  return Array.from(
    identifiers.values()
  );
}

async function resolveWritableLegacyGtin(
  prisma: PrismaClient,
  productId: number | undefined,
  gtin: string | undefined
): Promise<string | undefined> {
  if (!gtin) {
    return undefined;
  }

  const existing =
    await prisma.product.findUnique({
      where: {
        gtin,
      },
      select: {
        id: true,
      },
    });

  if (!existing || existing.id === productId) {
    return gtin;
  }

  return undefined;
}

function isUniqueConstraintField(
  target: unknown,
  expectedField: string
): boolean {
  if (typeof target === "string") {
    return target.includes(
      expectedField
    );
  }

  if (Array.isArray(target)) {
    return target.some(
      (field) =>
        String(field) ===
        expectedField
    );
  }

  return false;
}

function merchantNameFromSlug(
  slug: string
): string {
  if (slug === "ekosport") {
    return "Ekosport";
  }

  if (slug === "tonton-outdoor") {
    return "Tonton Outdoor";
  }

  return slug
    .split("-")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}