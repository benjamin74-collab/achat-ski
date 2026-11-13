import { PrismaClient, ProductIdentifierType } from "@prisma/client";
import type { AggregatedFeedItem, ImportStats } from "./feed-types";
import { normalizeGtin, toPriceCents } from "./normalize";

type Args = {
  prisma: PrismaClient;
  grouped: AggregatedFeedItem[];
  siteId: string;
  merchantId: number;
  feedKey: string;
  feedSourceId: number;
  affiliateProgramId: number;
  stats: ImportStats;
};

type Offer = Awaited<ReturnType<PrismaClient["offer"]["findMany"]>>[number];
type OfferChange = {
  offer: Offer;
  data: {
    priceCents: number;
    oldPriceCents: number | null;
    shippingCents: number | null;
    currency: string;
    inStock: boolean;
    availability: string | null;
    affiliateUrl: string;
    merchantProductUrl: string | null;
    active: boolean;
  };
  priceChanged: boolean;
};
type NewOffer = {
  productId: number;
  group: AggregatedFeedItem;
};

const CHUNK_SIZE = 500;
const MAX_MISSING_SHARE = 0.2;

function chunks<T>(values: T[], size = CHUNK_SIZE): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < values.length; i += size) result.push(values.slice(i, i + size));
  return result;
}

function uniqueGtins(group: AggregatedFeedItem): string[] {
  return [...new Set([...group.variantGtins, group.item.gtin]
    .map(normalizeGtin)
    .filter((v): v is string => Boolean(v)))];
}

function cents(value: number | undefined): number | null {
  return value === undefined ? null : toPriceCents(value);
}

/**
 * Import DELTA : lecture / comparaison d'abord, écritures d'offres ensuite.
 * Ne modifie jamais Product, SiteProduct, Brand, catégories ou identifiants.
 * Le mode FULL reste géré par import-service.ts.
 */
export async function syncDeltaOffers({
  prisma, grouped, siteId, merchantId, feedKey, feedSourceId,
  affiliateProgramId, stats,
}: Args): Promise<{ safeToReconcile: boolean; unchangedOffers: number }> {
  const [offers, allMerchantOffers] = await Promise.all([
    prisma.offer.findMany({ where: { merchantId, feedKey } }),
    prisma.offer.findMany({
      where: { merchantId },
      select: { id: true, productId: true, feedKey: true },
    }),
  ]);
  const byId = new Map(offers.map(offer => [offer.id, offer]));
  const byProduct = new Map(allMerchantOffers.map(offer => [offer.productId, offer]));

  const byExternal = new Map<string, Set<number>>();
  const byParent = new Map<string, Set<number>>();
  const byGroup = new Map<string, Set<number>>();
  function index(map: Map<string, Set<number>>, key: string | null | undefined, id: number) {
    if (!key) return;
    const set = map.get(key) ?? new Set<number>();
    set.add(id);
    map.set(key, set);
  }
  for (const offer of offers) {
    index(byExternal, offer.externalId, offer.id);
    index(byParent, offer.parentExternalId, offer.id);
    index(byGroup, offer.sourceGroupKey, offer.id);
  }

  // Les EAN sont chargés par lots pour éviter les limites de paramètres SQL.
  const gtins = [...new Set(grouped.flatMap(uniqueGtins))];
  const gtinProducts = new Map<string, Set<number>>();
  function addGtin(value: string, productId: number) {
    const set = gtinProducts.get(value) ?? new Set<number>();
    set.add(productId);
    gtinProducts.set(value, set);
  }
  for (const batch of chunks(gtins)) {
    const [identifiers, products, skus] = await Promise.all([
      prisma.productIdentifier.findMany({
        where: { siteId, type: ProductIdentifierType.GTIN, value: { in: batch } },
        select: { value: true, productId: true },
      }),
      prisma.product.findMany({
        where: { gtin: { in: batch } }, select: { id: true, gtin: true },
      }),
      prisma.sku.findMany({
        where: { gtin: { in: batch } }, select: { productId: true, gtin: true },
      }),
    ]);
    for (const row of identifiers) addGtin(row.value, row.productId);
    for (const row of products) if (row.gtin) addGtin(row.gtin, row.id);
    for (const row of skus) if (row.gtin) addGtin(row.gtin, row.productId);
  }

  const candidateIds = [...new Set([...gtinProducts.values()].flatMap(set => [...set]))];
  const visibleIds = new Set<number>();
  for (const batch of chunks(candidateIds)) {
    const visible = await prisma.siteProduct.findMany({
      where: {
        siteId, productId: { in: batch }, active: true,
        published: true, archivedAt: null,
      },
      select: { productId: true },
    });
    for (const row of visible) visibleIds.add(row.productId);
  }

  // Phase 1 : construire le plan sans écrire en base.
  const seen = new Set<number>();
  const reservedProducts = new Set<number>();
  const updates: OfferChange[] = [];
  const creates: NewOffer[] = [];
  let unchangedOffers = 0;
  let unresolved = 0;
  let ambiguous = 0;

  for (const group of grouped) {
    const item = group.item;
    const identity = new Set<number>();
    const collect = (map: Map<string, Set<number>>, values: (string | undefined)[]) => {
      for (const value of values) {
        if (!value) continue;
        for (const id of map.get(value) ?? []) identity.add(id);
      }
    };
    collect(byExternal, [...group.merchantExternalIds, item.externalId]);
    collect(byParent, [...group.merchantParentExternalIds, item.parentExternalId]);
    collect(byGroup, [group.groupKey]);

    const candidates = new Set<number>();
    for (const gtin of uniqueGtins(group)) {
      for (const productId of gtinProducts.get(gtin) ?? []) {
        if (visibleIds.has(productId)) candidates.add(productId);
      }
    }

    if (identity.size > 1 || candidates.size > 1) {
      ambiguous++;
      stats.skippedRows += group.sourceItemCount;
      continue;
    }
    let existing = identity.size === 1 ? byId.get([...identity][0]) : undefined;
    if (!existing && candidates.size === 1) {
      const linked = byProduct.get([...candidates][0]);
      if (linked && linked.feedKey === feedKey) existing = byId.get(linked.id);
      else if (linked) {
        ambiguous++;
        stats.skippedRows += group.sourceItemCount;
        continue;
      }
    }
    if (existing && candidates.size === 1 && !candidates.has(existing.productId)) {
      ambiguous++;
      stats.skippedRows += group.sourceItemCount;
      continue;
    }
    if (existing && seen.has(existing.id)) {
      ambiguous++;
      stats.skippedRows += group.sourceItemCount;
      continue;
    }
    if (!existing && candidates.size !== 1) {
      unresolved++;
      stats.skippedRows += group.sourceItemCount;
      continue;
    }

    const priceCents = toPriceCents(item.price);
    const oldPriceCents = cents(item.oldPrice);
    const shippingCents = cents(item.shippingCost);
    if (existing) {
      seen.add(existing.id);
      const priceChanged = existing.priceCents !== priceCents ||
        existing.oldPriceCents !== oldPriceCents ||
        existing.shippingCents !== shippingCents ||
        existing.currency !== item.currency || existing.inStock !== item.inStock;
      const data = {
        priceCents, oldPriceCents, shippingCents, currency: item.currency,
        inStock: item.inStock, availability: item.availability ?? null,
        affiliateUrl: item.affiliateUrl,
        merchantProductUrl: item.merchantProductUrl ?? null,
        active: true,
      };
      const metadataChanged = existing.availability !== data.availability ||
        existing.affiliateUrl !== data.affiliateUrl ||
        existing.merchantProductUrl !== data.merchantProductUrl || !existing.active;
      if (priceChanged || metadataChanged) updates.push({ offer: existing, data, priceChanged });
      else unchangedOffers++;
      continue;
    }

    const productId = [...candidates][0];
    if (byProduct.has(productId) || reservedProducts.has(productId)) {
      ambiguous++;
      stats.skippedRows += group.sourceItemCount;
      continue;
    }
    reservedProducts.add(productId);
    creates.push({ productId, group });
  }

  const missing = offers.filter(offer => offer.active && !seen.has(offer.id));
  const activeCount = offers.filter(offer => offer.active).length;
  const cleanFeed = stats.errors === 0 && stats.skippedRows === 0 &&
    unresolved === 0 && ambiguous === 0 && grouped.length > 0;
  const excessiveMissing = activeCount > 0 && missing.length / activeCount > MAX_MISSING_SHARE;
  const safeToReconcile = cleanFeed && !excessiveMissing;

  // Une disparition massive peut signaler un flux tronqué : aucune écriture avant validation.
  if (excessiveMissing && cleanFeed && feedSourceId !== 2) {
    throw new Error(
      `DELTA bloqué avant écritures : ${missing.length}/${activeCount} offres absentes (>20%).`
    );
  }

  // Phase 2 : appliquer uniquement les changements identifiés.
  // L'absence de transaction globale évite une transaction longue sur un grand flux.
  for (const change of updates) {
    await prisma.$transaction(async tx => {
      await tx.offer.update({ where: { id: change.offer.id }, data: change.data });
      if (change.priceChanged) {
        await tx.priceHistory.create({
          data: {
            offerId: change.offer.id,
            priceCents: change.data.priceCents,
            oldPriceCents: change.data.oldPriceCents,
            shippingCents: change.data.shippingCents,
            currency: change.data.currency,
            inStock: change.data.inStock,
          },
        });
      }
    });
    stats.updatedOffers++;
  }

  for (const { productId, group } of creates) {
    const item = group.item;
    const priceCents = toPriceCents(item.price);
    const oldPriceCents = cents(item.oldPrice);
    const shippingCents = cents(item.shippingCost);
    await prisma.$transaction(async tx => {
      const created = await tx.offer.create({
        data: {
          productId, merchantId, affiliateProgramId, feedSourceId, feedKey,
          affiliateUrl: item.affiliateUrl,
          merchantProductUrl: item.merchantProductUrl ?? null,
          externalId: item.externalId ?? null,
          parentExternalId: item.parentExternalId ?? null,
          priceCents, oldPriceCents, shippingCents, currency: item.currency,
          inStock: item.inStock, availability: item.availability ?? null,
          active: true, imageUrl: item.imageUrl ?? null,
          sourceItemCount: group.sourceItemCount, sourceGroupKey: group.groupKey,
        },
      });
      await tx.priceHistory.create({
        data: {
          offerId: created.id, priceCents, oldPriceCents, shippingCents,
          currency: item.currency, inStock: item.inStock,
        },
      });
    });
    stats.createdOffers++;
  }

  // Le flux Tonton (id=2) conserve sa protection de réconciliation historique.
  if (safeToReconcile && feedSourceId !== 2 && missing.length > 0) {
    for (const batch of chunks(missing.map(offer => offer.id))) {
      const result = await prisma.offer.updateMany({
        where: { id: { in: batch }, active: true },
        data: { active: false, inStock: false },
      });
      stats.deactivatedOffers += result.count;
    }
  }

  console.log(
    `[DELTA] unchanged=${unchangedOffers} updated=${stats.updatedOffers} ` +
    `created=${stats.createdOffers} deactivated=${stats.deactivatedOffers} ` +
    `unresolved=${unresolved} ambiguous=${ambiguous} ` +
    `safeToReconcile=${safeToReconcile}`
  );
  return { safeToReconcile, unchangedOffers };
}
