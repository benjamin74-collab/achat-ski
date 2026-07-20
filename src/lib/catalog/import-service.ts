import type { PrismaClient } from "@prisma/client";
import type { NormalizedFeedItem } from "./feed-types";

import { matchFeedItem } from "./matching";
import {
  buildProductSlug,
  normalizeProductName,
  normalizeVariant,
  slugify,
  toPriceCents,
} from "./normalize";

type ImportStats = {
  createdProducts: number;
  updatedProducts: number;
  createdSkus: number;
  updatedSkus: number;
  createdOffers: number;
  updatedOffers: number;
};

export async function importNormalizedFeedItem(
  prisma: PrismaClient,
  item: NormalizedFeedItem,
  stats: ImportStats
) {
  const merchant = await upsertMerchant(prisma, item);
  const brandId = await upsertBrand(prisma, item);

  const match = await matchFeedItem(prisma, item);

  const product =
    match.productId
      ? await updateMatchedProduct(prisma, item, match.productId, brandId, stats)
      : await createProduct(prisma, item, brandId, stats);

  const sku =
    match.skuId
      ? await updateMatchedSku(prisma, item, match.skuId, product.id, stats)
      : await createSku(prisma, item, product.id, stats);

  const offer = await upsertOffer(prisma, item, merchant.id, sku.id, stats);

  return {
    product,
    sku,
    offer,
    match,
  };
}

async function upsertMerchant(prisma: PrismaClient, item: NormalizedFeedItem) {
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

async function upsertBrand(
  prisma: PrismaClient,
  item: NormalizedFeedItem
): Promise<number | undefined> {
  if (!item.brand) return undefined;

  const brand = await prisma.brand.upsert({
    where: { slug: slugify(item.brand) },
    update: {
      name: item.brand,
      active: true,
    },
    create: {
      name: item.brand,
      slug: slugify(item.brand),
      active: true,
    },
  });

  return brand.id;
}

async function updateMatchedProduct(
  prisma: PrismaClient,
  item: NormalizedFeedItem,
  productId: number,
  brandId: number | undefined,
  stats: ImportStats
) {
  const name = item.cleanName || item.title;
  const normalizedName = normalizeProductName(name);

  stats.updatedProducts += 1;

  return prisma.product.update({
    where: { id: productId },
    data: {
      name,
      model: name,
      brandId,
      description: item.description,
      normalizedName,
      manufacturerReference: item.manufacturerReference,
      imageUrl: item.imageUrl,
      active: true,
      attributes: {
        sourceCategoryPath: item.categoryPath,
      },
    },
  });
}

async function createProduct(
  prisma: PrismaClient,
  item: NormalizedFeedItem,
  brandId: number | undefined,
  stats: ImportStats
) {
  const name = item.cleanName || item.title;
  const normalizedName = normalizeProductName(name);
  const baseSlug = buildProductSlug(item);

  const product = await prisma.product.create({
    data: {
      name,
      model: name,
      brand: item.brand,
      brandId,
      slug: await uniqueProductSlug(prisma, baseSlug),
      description: item.description,
      normalizedName,
      manufacturerReference: item.manufacturerReference,
      imageUrl: item.imageUrl,
      published: false,
      active: true,
      attributes: {
        sourceCategoryPath: item.categoryPath,
      },
    },
  });

  stats.createdProducts += 1;

  return product;
}

async function updateMatchedSku(
  prisma: PrismaClient,
  item: NormalizedFeedItem,
  skuId: number,
  productId: number,
  stats: ImportStats
) {
  const normalizedVariant = normalizeVariant(item);
  const displayName = buildSkuDisplayName(item);

  stats.updatedSkus += 1;

  return prisma.sku.update({
    where: { id: skuId },
    data: {
      productId,
      displayName,
      variant: displayName,
      merchantSku: item.externalId,
      manufacturerReference: item.manufacturerReference,
      size: item.size,
      color: item.color,
      gender: item.gender,
      normalizedVariant,
    },
  });
}

async function createSku(
  prisma: PrismaClient,
  item: NormalizedFeedItem,
  productId: number,
  stats: ImportStats
) {
  const normalizedVariant = normalizeVariant(item);
  const displayName = buildSkuDisplayName(item);

  const sku = await prisma.sku.create({
    data: {
      productId,
      displayName,
      variant: displayName,
      gtin: item.ean,
      merchantSku: item.externalId,
      manufacturerReference: item.manufacturerReference,
      size: item.size,
      color: item.color,
      gender: item.gender,
      normalizedVariant,
      attributes: {},
    },
  });

  stats.createdSkus += 1;

  return sku;
}

async function upsertOffer(
  prisma: PrismaClient,
  item: NormalizedFeedItem,
  merchantId: number,
  skuId: number,
  stats: ImportStats
) {
  const priceCents = toPriceCents(item.price);
  const oldPriceCents = item.oldPrice ? toPriceCents(item.oldPrice) : null;
  const shippingCents = item.shippingCost ? toPriceCents(item.shippingCost) : null;

  const existingOffer = await prisma.offer.findFirst({
    where: {
      merchantId,
      OR: [
        item.externalId ? { externalId: item.externalId } : undefined,
        { skuId },
      ].filter(Boolean) as { externalId?: string; skuId?: number }[],
    },
  });

  if (existingOffer) {
    const priceChanged =
      existingOffer.priceCents !== priceCents ||
      existingOffer.oldPriceCents !== oldPriceCents ||
      existingOffer.inStock !== item.inStock;

    const offer = await prisma.offer.update({
      where: { id: existingOffer.id },
      data: {
        skuId,
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
        lastSeen: new Date(),
      },
    });

    stats.updatedOffers += 1;

    if (priceChanged) {
      await createPriceHistory(prisma, offer.id, item, priceCents, oldPriceCents, shippingCents);
    }

    return offer;
  }

  const offer = await prisma.offer.create({
    data: {
      skuId,
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
      lastSeen: new Date(),
    },
  });

  await createPriceHistory(prisma, offer.id, item, priceCents, oldPriceCents, shippingCents);

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

async function uniqueProductSlug(
  prisma: PrismaClient,
  baseSlug: string
): Promise<string> {
  let slug = baseSlug || "produit";
  let counter = 2;

  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

function buildSkuDisplayName(item: NormalizedFeedItem): string | undefined {
  return [item.size, item.color, item.gender]
    .filter(Boolean)
    .join(" / ") || undefined;
}

function merchantNameFromSlug(slug: string): string {
  if (slug === "ekosport") return "Ekosport";
  if (slug === "tonton-outdoor") return "Tonton Outdoor";

  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}