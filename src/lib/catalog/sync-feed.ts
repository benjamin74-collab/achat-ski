import {
  PrismaClient,
} from "@prisma/client";

import {
  aggregateFeedItems,
  type CategorizedFeedItem,
} from "./aggregate";

import {
  loadFeedCategoryMappings,
  resolveFeedCategories,
} from "./category-mapping";

import {
  enrichFeedCategories,
  loadCategoryEnrichmentRules,
} from "./category-enrichment";

import {
  parseCsv,
} from "./csv";

import {
  loadFeedRuntime,
  type FeedRuntime,
} from "./feed-runtime";

import {
  normalizeGenericFeed,
  validateRuntimeColumnMappings,
} from "./generic-normalizer";

import {
  createEmptyImportStats,
  type FeedImportResult,
  type ImportStats,
} from "./feed-types";

import {
  importAggregatedFeedItem,
} from "./import-service";

import {
  validateFeedItem,
} from "./validate";

export type SyncFeedTrigger =
  | "MANUAL"
  | "CRON"
  | "API"
  | "RETRY";

type SyncFeedSourceOptions = {
  prisma: PrismaClient;
  feedSourceId: number;
  trigger?: SyncFeedTrigger;
};

type SyncFeedContentOptions = {
  prisma: PrismaClient;
  runtime: FeedRuntime;
  content: string;

  trigger?: SyncFeedTrigger;

  sourceUrl?: string;
  filename?: string;
};

export async function syncFeedSourceById({
  prisma,
  feedSourceId,
  trigger = "CRON",
}: SyncFeedSourceOptions): Promise<FeedImportResult> {
  const runtime =
    await loadFeedRuntime(
      prisma,
      feedSourceId
    );

  await prisma.feedSource.update({
    where: {
      id: feedSourceId,
    },
    data: {
      lastRunAt: new Date(),
      lastStatus: "RUNNING",
      lastErrorMessage: null,
    },
  });

  try {
    const response = await fetch(
      runtime.sourceUrl,
      {
        cache: "no-store",

        headers: {
          "user-agent":
            "Meilleur-Ski Universal Feed Importer/1.0",

          accept:
            "text/csv,text/tab-separated-values,application/json,application/xml,text/xml,*/*",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Téléchargement impossible : ${response.status} ${response.statusText}`
      );
    }

    const buffer =
      await response.arrayBuffer();

    const content =
      decodeFeedContent(
        buffer,
        runtime.encoding
      );

    const filename =
      extractFilename(
        response.headers.get(
          "content-disposition"
        )
      ) ??
      `${runtime.slug}.${extensionForFormat(
        runtime.format
      )}`;

    return await syncFeedContent({
      prisma,
      runtime,
      content,
      trigger,
      sourceUrl:
        runtime.sourceUrl,
      filename,
    });
  } catch (error) {
    await prisma.feedSource.update({
      where: {
        id: feedSourceId,
      },
      data: {
        lastStatus:
          "FAILED",

        lastFailureAt:
          new Date(),

        lastErrorMessage:
          error instanceof Error
            ? error.message
            : String(error),

        nextRunAt:
          calculateNextRunAt(
            runtime.frequency,
            new Date()
          ),
      },
    });

    throw error;
  }
}

export async function syncFeedContent({
  prisma,
  runtime,
  content,
  trigger = "MANUAL",
  sourceUrl,
  filename,
}: SyncFeedContentOptions): Promise<FeedImportResult> {
  /*
   * Recharge toujours le runtime depuis la base
   * afin d'utiliser la configuration la plus récente.
   */
  runtime =
    await loadFeedRuntime(
      prisma,
      runtime.feedSourceId
    );

  if (
    runtime.format !== "CSV" &&
    runtime.format !== "TSV"
  ) {
    throw new Error(
      `Le format ${runtime.format} n'est pas encore pris en charge par le moteur V1.`
    );
  }

  const mappingErrors =
    validateRuntimeColumnMappings(
      runtime.normalizerConfig
        .mappings
    );

  if (
    mappingErrors.length > 0
  ) {
    throw new Error(
      [
        "Configuration de colonnes invalide :",
        ...mappingErrors,
      ].join("\n")
    );
  }

  const startedAt =
    new Date();

  const feedKey = [
    runtime.siteId,
    runtime.slug,
  ].join(":");

  const rows =
    parseCsv(
      content,
      {
        delimiter:
          runtime.delimiter,
      }
    );

  const stats =
    createEmptyImportStats(
      rows.length
    );

  const normalizedItems =
    normalizeGenericFeed(
      rows,
      runtime.normalizerConfig
    );

  stats.normalizedRows =
    normalizedItems.length;

  const feedImport =
    await prisma.feedImport.create({
      data: {
        merchantId:
          runtime.merchant.id,

        feedSourceId:
          runtime.feedSourceId,

        trigger,

        platform:
          runtime
            .affiliateNetwork
            .slug,

        filename:
          filename ??
          `${runtime.slug}.${extensionForFormat(
            runtime.format
          )}`,

        feedKey,

        sourceUrl:
          sourceUrl ??
          runtime.sourceUrl,

        status:
          "RUNNING",

        totalRows:
          rows.length,
      },
    });

  try {
    const [
      categorySource,
      categoryEnrichmentRules,
    ] =
      await Promise.all([
        loadFeedCategoryMappings(
          prisma,
          runtime.feedSourceId
        ),

        loadCategoryEnrichmentRules(
          prisma,
          runtime.siteId,
          runtime.feedSourceId
        ),
      ]);

    if (
      categorySource
        .mappings
        .length === 0
    ) {
      throw new Error(
        `Aucun CategoryExternalMapping actif n'est configuré pour le flux "${runtime.name}".`
      );
    }

    const accepted:
      CategorizedFeedItem[] =
      [];

    /*
     * Validation et résolution des catégories.
     *
     * Les lignes invalides ou non mappées sont
     * simplement ignorées sans générer un log
     * individuel pour chaque produit.
     */
    for (
      const item of
      normalizedItems
    ) {
      const validation =
        validateFeedItem(
          item
        );

      if (
        !validation.valid
      ) {
        stats.skippedRows += 1;
        stats.errors += 1;

        continue;
      }

      const mappedCategoryResolution =
        resolveFeedCategories(
          item.categoryPath,
          categorySource
        );

      if (
        !mappedCategoryResolution
      ) {
        stats.skippedRows += 1;

        continue;
      }

      const categoryResolution =
        enrichFeedCategories(
          item,
          mappedCategoryResolution,
          categorySource,
          categoryEnrichmentRules
        );

      accepted.push({
        item,
        categoryResolution,
      });
    }

    stats.acceptedRows =
      accepted.length;

    const grouped =
      aggregateFeedItems(
        accepted
      );

    stats.groupedProducts =
      grouped.length;

    if (
      grouped.length === 0
    ) {
      throw new Error(
        "Aucun produit n'a été retenu. La réconciliation est annulée afin d'éviter une désactivation massive."
      );
    }

    /*
     * Cache des marques résolues pendant cet import.
     *
     * Il évite de refaire inutilement les mêmes
     * résolutions de marque pour chaque produit.
     */
    const brandCache =
      new Map<
        string,
        {
          id: number;
          name: string;
        }
      >();

    for (
      const aggregated of
      grouped
    ) {
      try {
        const imported =
          await importAggregatedFeedItem(
            prisma,
            aggregated,
            {
              id:
                runtime
                  .merchant
                  .id,

              name:
                runtime
                  .merchant
                  .name,

              slug:
                runtime
                  .merchant
                  .slug,

              platform:
                runtime
                  .merchant
                  .platform,

              network:
                runtime
                  .merchant
                  .platform
                  .toLowerCase(),

              programId:
                null,

              status:
                "active",

              websiteUrl:
                null,

              active:
                true,

              createdAt:
                startedAt,

              updatedAt:
                startedAt,
            },
            feedKey,
            startedAt,
            stats,
            brandCache
          );

        await prisma.siteProduct.upsert({
          where: {
            siteId_productId: {
              siteId:
                runtime.siteId,

              productId:
                imported
                  .product
                  .id,
            },
          },

          update: {
            active:
              true,

            lastSeenAt:
              startedAt,

            archivedAt:
              null,
          },

          create: {
            siteId:
              runtime.siteId,

            productId:
              imported
                .product
                .id,

            published:
              false,

            active:
              true,

            firstSeenAt:
              startedAt,

            lastSeenAt:
              startedAt,
          },
        });
      } catch (error) {
        stats.errors += 1;

        /*
         * On conserve ce log :
         * contrairement aux anciens logs de debug,
         * celui-ci correspond à une vraie erreur
         * d'import d'un produit retenu.
         */
        console.error(
          `[universal-feed] ${runtime.slug} / ${aggregated.groupKey}`,
          error
        );
      }
    }

    await reconcileMissingOffers({
      prisma,
      runtime,
      feedKey,
      startedAt,
      stats,
    });

    const status =
      stats.errors > 0
        ? "PARTIAL"
        : "SUCCESS";

    const finishedAt =
      new Date();

    await Promise.all([
      prisma.feedImport.update({
        where: {
          id:
            feedImport.id,
        },

        data: {
          status,

          importedRows:
            stats.acceptedRows,

          skippedRows:
            stats.skippedRows,

          createdProducts:
            stats.createdProducts,

          updatedProducts:
            stats.updatedProducts,

          createdSkus:
            0,

          updatedSkus:
            0,

          createdOffers:
            stats.createdOffers,

          updatedOffers:
            stats.updatedOffers,

          deactivatedOffers:
            stats.deactivatedOffers,

          deactivatedProducts:
            stats.deactivatedProducts,

          deletedProducts:
            stats.deletedProducts,

          errorsCount:
            stats.errors,

          finishedAt,
        },
      }),

      prisma.feedSource.update({
        where: {
          id:
            runtime.feedSourceId,
        },

        data: {
          lastRunAt:
            startedAt,

          lastSuccessAt:
            finishedAt,

          lastStatus:
            status,

          lastErrorMessage:
            null,

          nextRunAt:
            calculateNextRunAt(
              runtime.frequency,
              finishedAt
            ),
        },
      }),
    ]);

    return {
      feedImportId:
        feedImport.id,

      feedKey,

      status,

      ...stats,
    };
  } catch (error) {
    const finishedAt =
      new Date();

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    await Promise.all([
      prisma.feedImport.update({
        where: {
          id:
            feedImport.id,
        },

        data: {
          status:
            "FAILED",

          notes:
            errorMessage,

          importedRows:
            stats.acceptedRows,

          skippedRows:
            stats.skippedRows,

          errorsCount:
            stats.errors + 1,

          finishedAt,
        },
      }),

      prisma.feedSource.update({
        where: {
          id:
            runtime.feedSourceId,
        },

        data: {
          lastRunAt:
            startedAt,

          lastFailureAt:
            finishedAt,

          lastStatus:
            "FAILED",

          lastErrorMessage:
            errorMessage,

          nextRunAt:
            calculateNextRunAt(
              runtime.frequency,
              finishedAt
            ),
        },
      }),
    ]);

    throw error;
  }
}

type ReconcileOptions = {
  prisma: PrismaClient;
  runtime: FeedRuntime;
  feedKey: string;
  startedAt: Date;
  stats: ImportStats;
};

async function reconcileMissingOffers({
  prisma,
  runtime,
  feedKey,
  startedAt,
  stats,
}: ReconcileOptions): Promise<void> {
  const missingOffers =
    await prisma.offer.findMany({
      where: {
        merchantId:
          runtime.merchant.id,

        feedKey,

        active:
          true,

        OR: [
          {
            lastSeen:
              null,
          },
          {
            lastSeen: {
              lt:
                startedAt,
            },
          },
        ],
      },

      select: {
        id:
          true,

        productId:
          true,
      },
    });

  if (
    missingOffers.length === 0
  ) {
    return;
  }

  await prisma.offer.updateMany({
    where: {
      id: {
        in:
          missingOffers.map(
            (offer) =>
              offer.id
          ),
      },
    },

    data: {
      active:
        false,

      inStock:
        false,
    },
  });

  stats.deactivatedOffers +=
    missingOffers.length;

  const productIds =
    Array.from(
      new Set(
        missingOffers.map(
          (offer) =>
            offer.productId
        )
      )
    );

  for (
    const productId of
    productIds
  ) {
    const activeOffers =
      await prisma.offer.count({
        where: {
          productId,

          active:
            true,
        },
      });

    if (
      activeOffers > 0
    ) {
      continue;
    }

    await prisma.siteProduct.updateMany({
      where: {
        siteId:
          runtime.siteId,

        productId,

        active:
          true,
      },

      data: {
        active:
          false,

        published:
          false,

        archivedAt:
          new Date(),
      },
    });

    const [
      tests,
      reviews,
      clicks,
      activeSiteProducts,
    ] =
      await Promise.all([
        prisma.editorialTest.count({
          where: {
            productId,
          },
        }),

        prisma.review.count({
          where: {
            productId,
          },
        }),

        prisma.click.count({
          where: {
            productId,
          },
        }),

        prisma.siteProduct.count({
          where: {
            productId,

            active:
              true,
          },
        }),
      ]);

    if (
      tests === 0 &&
      reviews === 0 &&
      clicks === 0 &&
      activeSiteProducts === 0
    ) {
      await prisma.product.delete({
        where: {
          id:
            productId,
        },
      });

      stats.deletedProducts += 1;

      continue;
    }

    if (
      activeSiteProducts === 0
    ) {
      await prisma.product.update({
        where: {
          id:
            productId,
        },

        data: {
          active:
            false,

          published:
            false,
        },
      });

      stats.deactivatedProducts += 1;
    }
  }
}

export function calculateNextRunAt(
  frequency:
    FeedRuntime["frequency"],
  from:
    Date
): Date | null {
  const next =
    new Date(from);

  switch (frequency) {
    case "EVERY_6_HOURS":
      next.setHours(
        next.getHours() + 6
      );

      return next;

    case "EVERY_12_HOURS":
      next.setHours(
        next.getHours() + 12
      );

      return next;

    case "DAILY":
      next.setDate(
        next.getDate() + 1
      );

      return next;

    case "WEEKLY":
      next.setDate(
        next.getDate() + 7
      );

      return next;

    case "MANUAL_ONLY":
    default:
      return null;
  }
}

function decodeFeedContent(
  buffer:
    ArrayBuffer,
  encoding:
    string
): string {
  try {
    return new TextDecoder(
      encoding ||
        "utf-8"
    ).decode(
      buffer
    );
  } catch {
    return new TextDecoder(
      "utf-8"
    ).decode(
      buffer
    );
  }
}

function extractFilename(
  contentDisposition:
    string | null
): string | undefined {
  if (
    !contentDisposition
  ) {
    return undefined;
  }

  const utf8Match =
    contentDisposition.match(
      /filename\*=UTF-8''([^;]+)/i
    );

  if (
    utf8Match?.[1]
  ) {
    return decodeURIComponent(
      utf8Match[1].replace(
        /^["']|["']$/g,
        ""
      )
    );
  }

  const normalMatch =
    contentDisposition.match(
      /filename=["']?([^;"']+)["']?/i
    );

  return normalMatch?.[1]
    ?.trim();
}

function extensionForFormat(
  format:
    FeedRuntime["format"]
): string {
  switch (format) {
    case "TSV":
      return "tsv";

    case "JSON":
      return "json";

    case "XML":
      return "xml";

    case "CSV":
    default:
      return "csv";
  }
}