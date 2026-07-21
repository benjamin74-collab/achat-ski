import type {
  Merchant,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import type {
  AggregatedFeedItem,
  ImportStats,
  NormalizedFeedItem,
} from "./feed-types";

import { matchFeedItem } from "./matching";
import {
  buildProductSlug,
  normalizeProductName,
  slugify,
  toPriceCents,
} from "./normalize";

type BrandCache = Map<string, number>;

export async function upsertFeedMerchant(
  prisma: PrismaClient,
  item: NormalizedFeedItem
): Promise<Merchant> {
  return prisma.merchant.upsert({
    where: { slug: item.merchantSlug },
    update: {
      active: true,
      status: "active",
      network: item.merchantPlatform.toLowerCase(),
      platform: item.merchantPlatform,
    },
    create: {
      name: merchantNameFromSlug(item.merchantSlug),
      slug: item.merchantSlug,
      network: item.merchantPlatform.toLowerCase(),
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
  seenAt: Date,
  stats: ImportStats,
  brandCache: BrandCache
) {
  const { item, category } = aggregated;

  const brandId = await upsertBrand(
    prisma,
    item,
    brandCache
  );

  const match = await matchFeedItem(
    prisma,
    item,
    merchant.id,
    brandId
  );

  const product = match.productId
    ? await updateMatchedProduct(
        prisma,
        aggregated,
        match.productId,
        brandId,
        stats
      )
    : await createProduct(
        prisma,
        aggregated,
        brandId,
        stats
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
    category,
  };
}

async function upsertBrand(
  prisma: PrismaClient,
  item: NormalizedFeedItem,
  cache: BrandCache
): Promise<number | undefined> {
  if (!item.brand) return undefined;

  const brandSlug = slugify(item.brand);
  const cached = cache.get(brandSlug);
  if (cached) return cached;

  const brand = await prisma.brand.upsert({
    where: { slug: brandSlug },
    update: {
      name: item.brand,
      active: true,
    },
    create: {
      name: item.brand,
      slug: brandSlug,
      active: true,
    },
  });

  cache.set(brandSlug, brand.id);
  return brand.id;
}

async function updateMatchedProduct(
  prisma: PrismaClient,
  aggregated: AggregatedFeedItem,
  productId: number,
  brandId: number | undefined,
  stats: ImportStats
) {
  const { item, category } = aggregated;
  const name = item.cleanName || item.title;
  const normalizedName = normalizeProductName(name);

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      name,
      model: name,
      brand: item.brand,
      brandId,
      categoryId: category.id,
      description: item.description,
      normalizedName,
      manufacturerReference: item.manufacturerReference,
      imageUrl: item.imageUrl,
      active: true,
      published: true,
      attributes: buildProductAttributes(aggregated),
    },
  });

  stats.updatedProducts += 1;
  return product;
}

async function createProduct(
  prisma: PrismaClient,
  aggregated: AggregatedFeedItem,
  brandId: number | undefined,
  stats: ImportStats
) {
  const { item, category } = aggregated;
  const name = item.cleanName || item.title;
  const normalizedName = normalizeProductName(name);
  const baseSlug = buildProductSlug(item);

  const product = await prisma.product.create({
    data: {
      name,
      model: name,
      brand: item.brand,
      brandId,
      categoryId: category.id,
      slug: await uniqueProductSlug(prisma, baseSlug),
      description: item.description,
      normalizedName,
      manufacturerReference: item.manufacturerReference,
      imageUrl: item.imageUrl,
      published: true,
      active: true,
      attributes: buildProductAttributes(aggregated),
    },
  });

  stats.createdProducts += 1;
  return product;
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
  const { item, sourceItemCount } = aggregated;

  const priceCents = toPriceCents(item.price);
  const oldPriceCents =
    item.oldPrice !== undefined
      ? toPriceCents(item.oldPrice)
      : null;
  const shippingCents =
    item.shippingCost !== undefined
      ? toPriceCents(item.shippingCost)
      : null;

  const existingOffer = await prisma.offer.findUnique({
    where: {
      productId_merchantId: {
        productId,
        merchantId,
      },
    },
  });

  if (existingOffer) {
    const priceChanged =
      existingOffer.priceCents !== priceCents ||
      existingOffer.oldPriceCents !== oldPriceCents ||
      existingOffer.shippingCents !== shippingCents ||
      existingOffer.inStock !== item.inStock;

    const offer = await prisma.offer.update({
      where: { id: existingOffer.id },
      data: {
        affiliateUrl: item.affiliateUrl,
        priceCents,
        oldPriceCents,
        shippingCents,
        currency: item.currency,
        inStock: item.inStock,
        availability: item.availability,
        externalId: item.externalId ?? null,
        parentExternalId: item.parentExternalId ?? null,
        merchantProductUrl:
          item.merchantProductUrl ?? null,
        imageUrl: item.imageUrl ?? null,
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
      affiliateUrl: item.affiliateUrl,
      priceCents,
      oldPriceCents,
      shippingCents,
      currency: item.currency,
      inStock: item.inStock,
      availability: item.availability,
      externalId: item.externalId,
      parentExternalId: item.parentExternalId,
      merchantProductUrl: item.merchantProductUrl,
      imageUrl: item.imageUrl,
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
      aggregated.item.categoryPath ?? null,
    availableSizes: aggregated.availableSizes,
    availableColors: aggregated.availableColors,
    availableGenders: aggregated.availableGenders,
    sourceItemCount: aggregated.sourceItemCount,
    sourceGroupKey: aggregated.groupKey,
  };
}

async function uniqueProductSlug(
  prisma: PrismaClient,
  baseSlug: string
): Promise<string> {
  const safeBaseSlug = baseSlug || "produit";
  let slug = safeBaseSlug;
  let counter = 2;

  while (
    await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    })
  ) {
    slug = `${safeBaseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

function merchantNameFromSlug(slug: string): string {
  if (slug === "ekosport") return "Ekosport";
  if (slug === "tonton-outdoor") {
    return "Tonton Outdoor";
  }

  return slug
    .split("-")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(" ");
}
