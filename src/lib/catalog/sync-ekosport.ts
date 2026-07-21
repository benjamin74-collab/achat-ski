import { Prisma, PrismaClient } from "@prisma/client";

import { aggregateFeedItems } from "./aggregate";
import {
  loadEkosportCategoryMappings,
  resolveEkosportCategory,
} from "./category-mapping";
import { parseCsv } from "./csv";
import type {
  FeedImportResult,
  ImportStats,
  NormalizedFeedItem,
} from "./feed-types";
import { normalizeEkosportFeed } from "./import-ekosport";
import {
  importAggregatedFeedItem,
  upsertFeedMerchant,
} from "./import-service";
import { validateFeedItem } from "./validate";

type SyncEkosportOptions = {
  prisma: PrismaClient;
  content: string;
  feedKey: string;
  sourceUrl?: string;
  filename?: string;
};

export async function syncEkosportCsv({
  prisma,
  content,
  feedKey,
  sourceUrl,
  filename,
}: SyncEkosportOptions): Promise<FeedImportResult> {
  const startedAt = new Date();

  const rows = parseCsv(content, {
    delimiter: ";",
  });

  const normalizedItems = normalizeEkosportFeed(rows);
  const merchantSeed =
    normalizedItems[0] ??
    fallbackEkosportItem();

  const merchant = await upsertFeedMerchant(
    prisma,
    merchantSeed
  );

  const feedImport = await prisma.feedImport.create({
    data: {
      merchantId: merchant.id,
      platform: "kwanko",
      filename: filename ?? feedKey,
      feedKey,
      sourceUrl,
      status: "running",
      totalRows: rows.length,
    },
  });

  const stats: ImportStats = {
    totalRows: rows.length,
    normalizedRows: normalizedItems.length,
    acceptedRows: 0,
    skippedRows: 0,
    groupedProducts: 0,

    createdProducts: 0,
    updatedProducts: 0,
    createdOffers: 0,
    updatedOffers: 0,

    deactivatedOffers: 0,
    deactivatedProducts: 0,
    deletedProducts: 0,
    errors: 0,
  };

  try {
    const mappings =
      await loadEkosportCategoryMappings(prisma);

    if (mappings.length === 0) {
      throw new Error(
        "Aucun mapping Category.mapEkosport n'est configuré."
      );
    }

    const accepted = [];

    for (const item of normalizedItems) {
      const validation = validateFeedItem(item);

      if (!validation.valid) {
        stats.skippedRows += 1;
        stats.errors += 1;
        continue;
      }

      const category = resolveEkosportCategory(
        item.categoryPath,
        mappings
      );

      if (!category) {
        stats.skippedRows += 1;
        continue;
      }

      accepted.push({ item, category });
    }

    stats.acceptedRows = accepted.length;

    const grouped = aggregateFeedItems(accepted);
    stats.groupedProducts = grouped.length;

    if (grouped.length === 0) {
      throw new Error(
        "Aucun produit n'a été retenu. La réconciliation est annulée pour éviter une suppression massive."
      );
    }

    const brandCache = new Map<string, number>();

    for (const aggregated of grouped) {
      try {
        await importAggregatedFeedItem(
          prisma,
          aggregated,
          merchant,
          feedKey,
          startedAt,
          stats,
          brandCache
        );
      } catch (error) {
        stats.errors += 1;
        console.error(
          `[catalog-sync] ${aggregated.groupKey}`,
          error
        );
      }
    }

    await reconcileMissingOffers({
      prisma,
      merchantId: merchant.id,
      feedKey,
      startedAt,
      stats,
    });

    const status =
      stats.errors > 0
        ? "success_with_errors"
        : "success";

    await prisma.feedImport.update({
      where: { id: feedImport.id },
      data: {
        status,
        importedRows: stats.acceptedRows,
        skippedRows: stats.skippedRows,
        createdProducts: stats.createdProducts,
        updatedProducts: stats.updatedProducts,
        createdSkus: 0,
        updatedSkus: 0,
        createdOffers: stats.createdOffers,
        updatedOffers: stats.updatedOffers,
        deactivatedOffers: stats.deactivatedOffers,
        deactivatedProducts:
          stats.deactivatedProducts,
        deletedProducts: stats.deletedProducts,
        errorsCount: stats.errors,
        finishedAt: new Date(),
      },
    });

    return {
      feedImportId: feedImport.id,
      feedKey,
      status,
      ...stats,
    };
  } catch (error) {
    await prisma.feedImport.update({
      where: { id: feedImport.id },
      data: {
        status: "failed",
        notes:
          error instanceof Error
            ? error.message
            : String(error),
        importedRows: stats.acceptedRows,
        skippedRows: stats.skippedRows,
        errorsCount: stats.errors + 1,
        finishedAt: new Date(),
      },
    });

    throw error;
  }
}

type ReconcileOptions = {
  prisma: PrismaClient;
  merchantId: number;
  feedKey: string;
  startedAt: Date;
  stats: ImportStats;
};

async function reconcileMissingOffers({
  prisma,
  merchantId,
  feedKey,
  startedAt,
  stats,
}: ReconcileOptions) {
  const missingOffers = await prisma.offer.findMany({
    where: {
      merchantId,
      feedKey,
      active: true,
      OR: [
        { lastSeen: null },
        { lastSeen: { lt: startedAt } },
      ],
    },
    select: {
      id: true,
      productId: true,
    },
  });

  if (missingOffers.length === 0) return;

  await prisma.offer.updateMany({
    where: {
      id: {
        in: missingOffers.map((offer) => offer.id),
      },
    },
    data: {
      active: false,
      inStock: false,
    },
  });

  stats.deactivatedOffers += missingOffers.length;

  const productIds = Array.from(
    new Set(
      missingOffers.map((offer) => offer.productId)
    )
  );

  for (const productId of productIds) {
    const activeOffers = await prisma.offer.count({
      where: {
        productId,
        active: true,
      },
    });

    if (activeOffers > 0) continue;

    const [tests, reviews, clicks] = await Promise.all([
      prisma.editorialTest.count({
        where: { productId },
      }),
      prisma.review.count({
        where: { productId },
      }),
      prisma.click.count({
        where: { productId },
      }),
    ]);

    if (tests === 0 && reviews === 0 && clicks === 0) {
      await prisma.product.delete({
        where: { id: productId },
      });

      stats.deletedProducts += 1;
      continue;
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        active: false,
        published: false,
      },
    });

    stats.deactivatedProducts += 1;
  }
}

function fallbackEkosportItem(): NormalizedFeedItem {
  return {
    merchantSlug: "ekosport",
    merchantPlatform: "KWANKO",
    title: "Ekosport",
    price: 0,
    currency: "EUR",
    inStock: false,
    affiliateUrl: "https://www.ekosport.fr",
    rawData: {},
  };
}
