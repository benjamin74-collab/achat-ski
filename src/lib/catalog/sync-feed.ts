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
  type AggregatedFeedItem,
  type FeedImportResult,
  type ImportStats,
} from "./feed-types";

import {
  importAggregatedFeedItem,
} from "./import-service";

import {
  validateFeedItem,
} from "./validate";

import {
  normalizeBrandKey,
} from "./normalize";

const IMPORT_CONCURRENCY = 2;
const BULK_CHUNK_SIZE = 500;

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
     * Précharge toutes les marques actives en une seule requête.
     * Cela évite que upsertBrand() recharge toute la table Brand
     * pour chaque nouvelle clé rencontrée pendant l'import.
     */
    const brandCache =
      await buildBrandCache(
        prisma
      );

    const merchant = {
      id:
        runtime.merchant.id,

      name:
        runtime.merchant.name,

      slug:
        runtime.merchant.slug,

      platform:
        runtime.merchant.platform,

      network:
        runtime.merchant.platform
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
    };

    /*
     * Pour les marques réellement nouvelles, le premier produit
     * de chaque marque est traité séquentiellement. Cela évite
     * que plusieurs promesses concurrentes tentent de créer
     * simultanément la même marque.
     */
    const brandKeysSeen =
      new Set(
        brandCache.keys()
      );

    const warmupItems:
      AggregatedFeedItem[] =
      [];

    const parallelItems:
      AggregatedFeedItem[] =
      [];

    for (
      const aggregated of
      grouped
    ) {
      const brandKey =
        normalizeBrandKey(
          aggregated.item.brand
        );

      if (
        brandKey &&
        !brandKeysSeen.has(
          brandKey
        )
      ) {
        brandKeysSeen.add(
          brandKey
        );

        warmupItems.push(
          aggregated
        );

        continue;
      }

      parallelItems.push(
        aggregated
      );
    }

    const importOne =
      async (
        aggregated:
          AggregatedFeedItem
      ): Promise<number | null> => {
        try {
          const imported =
            await importAggregatedFeedItem(
              prisma,
              aggregated,
              merchant,
              feedKey,
              startedAt,
              stats,
              brandCache
            );

          return (
            imported.product.id
          );
        } catch (error) {
          stats.errors += 1;

          console.error(
            `[universal-feed] ${runtime.slug} / ${aggregated.groupKey}`,
            error
          );

          return null;
        }
      };

    /*
     * Amorçage des nouvelles marques.
     */
    const warmupProductIds:
      number[] = [];

    for (
      const aggregated of
      warmupItems
    ) {
      const productId =
        await importOne(
          aggregated
        );

      if (productId) {
        warmupProductIds.push(
          productId
        );
      }
    }

    await syncSiteProductsBulk(
      prisma,
      runtime.siteId,
      warmupProductIds,
      startedAt
    );

    /*
     * Si l'amorçage d'une nouvelle marque a échoué avant
     * la mise en cache de celle-ci, les autres produits de
     * cette marque restent traités séquentiellement.
     */
    const safeParallelItems:
      AggregatedFeedItem[] =
      [];

    const fallbackSequentialItems:
      AggregatedFeedItem[] =
      [];

    for (
      const aggregated of
      parallelItems
    ) {
      const brandKey =
        normalizeBrandKey(
          aggregated.item.brand
        );

      if (
        brandKey &&
        !brandCache.has(
          brandKey
        )
      ) {
        fallbackSequentialItems.push(
          aggregated
        );
      } else {
        safeParallelItems.push(
          aggregated
        );
      }
    }

    const fallbackProductIds:
      number[] = [];

    for (
      const aggregated of
      fallbackSequentialItems
    ) {
      const productId =
        await importOne(
          aggregated
        );

      if (productId) {
        fallbackProductIds.push(
          productId
        );
      }
    }

    await syncSiteProductsBulk(
      prisma,
      runtime.siteId,
      fallbackProductIds,
      startedAt
    );

    /*
     * Les produits dont la marque est désormais connue sont
     * traités avec une concurrence limitée.
     *
     * Cela réduit fortement le temps mur sans saturer le pool
     * PostgreSQL/Neon.
     */
    for (
      let index = 0;
      index <
      safeParallelItems.length;
      index +=
        IMPORT_CONCURRENCY
    ) {
      const batch =
        safeParallelItems.slice(
          index,
          index +
            IMPORT_CONCURRENCY
        );

      const productIds =
        (
          await Promise.all(
            batch.map(
              importOne
            )
          )
        ).filter(
          (
            productId
          ): productId is number =>
            productId !== null
        );

      /*
       * Au lieu d'un upsert SiteProduct par produit :
       * - un updateMany pour tous les produits existants ;
       * - un createMany avec skipDuplicates pour les nouveaux.
       *
       * On passe ainsi de N requêtes à 2 requêtes par lot.
       */
      await syncSiteProductsBulk(
        prisma,
        runtime.siteId,
        productIds,
        startedAt
      );
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
  /*
   * 1. Récupère en une requête toutes les offres du flux
   *    qui n'ont pas été vues pendant cet import.
   */
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

  /*
   * 2. Désactive toutes les offres manquantes en une seule
   *    opération au lieu de les traiter individuellement.
   */
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

  if (
    productIds.length === 0
  ) {
    return;
  }

  /*
   * 3. Cherche en une seule requête les produits qui ont
   *    encore au moins une offre active.
   *
   * L'ancienne version faisait un offer.count() par produit.
   */
  const productsWithActiveOffers =
    await prisma.offer.findMany({
      where: {
        productId: {
          in:
            productIds,
        },

        active:
          true,
      },

      select: {
        productId:
          true,
      },

      distinct: [
        "productId",
      ],
    });

  const activeOfferProductIds =
    new Set(
      productsWithActiveOffers.map(
        (offer) =>
          offer.productId
      )
    );

  const orphanProductIds =
    productIds.filter(
      (productId) =>
        !activeOfferProductIds.has(
          productId
        )
    );

  if (
    orphanProductIds.length === 0
  ) {
    return;
  }

  /*
   * 4. Archive les SiteProduct du site courant en une seule
   *    requête pour tous les produits devenus sans offre.
   */
  await prisma.siteProduct.updateMany({
    where: {
      siteId:
        runtime.siteId,

      productId: {
        in:
          orphanProductIds,
      },

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

  /*
   * 5. Toutes les vérifications qui étaient auparavant
   *    réalisées produit par produit sont chargées en parallèle
   *    et sous forme d'ensembles de productId.
   *
   * Ancienne mécanique :
   *   jusqu'à 5 requêtes supplémentaires par produit.
   *
   * Nouvelle mécanique :
   *   4 requêtes au total, quel que soit le nombre de produits.
   */
  const [
    productsWithTests,
    productsWithReviews,
    productsWithClicks,
    productsWithActiveSites,
  ] =
    await Promise.all([
      prisma.editorialTest.findMany({
        where: {
          productId: {
            in:
              orphanProductIds,
          },
        },

        select: {
          productId:
            true,
        },

        distinct: [
          "productId",
        ],
      }),

      prisma.review.findMany({
        where: {
          productId: {
            in:
              orphanProductIds,
          },
        },

        select: {
          productId:
            true,
        },

        distinct: [
          "productId",
        ],
      }),

      prisma.click.findMany({
        where: {
          productId: {
            in:
              orphanProductIds,
          },
        },

        select: {
          productId:
            true,
        },

        distinct: [
          "productId",
        ],
      }),

      prisma.siteProduct.findMany({
        where: {
          productId: {
            in:
              orphanProductIds,
          },

          active:
            true,
        },

        select: {
          productId:
            true,
        },

        distinct: [
          "productId",
        ],
      }),
    ]);

  const protectedProductIds =
    new Set<number>();

  for (
    const row of
    productsWithTests
  ) {
    protectedProductIds.add(
      row.productId
    );
  }

  for (
    const row of
    productsWithReviews
  ) {
    protectedProductIds.add(
      row.productId
    );
  }

  for (
    const row of
    productsWithClicks
  ) {
    protectedProductIds.add(
      row.productId
    );
  }

  const activeSiteProductIds =
    new Set(
      productsWithActiveSites.map(
        (row) =>
          row.productId
      )
    );

  /*
   * Un produit peut être supprimé uniquement s'il :
   * - n'a plus aucune offre active ;
   * - n'est actif sur aucun site ;
   * - n'a ni test, ni avis, ni clic.
   *
   * Cette logique est identique à l'ancienne version,
   * mais les contrôles sont désormais groupés.
   */
  const deletableProductIds =
    orphanProductIds.filter(
      (productId) =>
        !activeSiteProductIds.has(
          productId
        ) &&
        !protectedProductIds.has(
          productId
        )
    );

  for (
    const chunk of
    chunkArray(
      deletableProductIds,
      BULK_CHUNK_SIZE
    )
  ) {
    const result =
      await prisma.product.deleteMany({
        where: {
          id: {
            in:
              chunk,
          },
        },
      });

    stats.deletedProducts +=
      result.count;
  }

  const deletableSet =
    new Set(
      deletableProductIds
    );

  /*
   * Les produits protégés par du contenu éditorial ou de
   * l'historique restent en base mais sont désactivés lorsqu'ils
   * ne sont plus actifs sur aucun site.
   */
  const deactivatableProductIds =
    orphanProductIds.filter(
      (productId) =>
        !activeSiteProductIds.has(
          productId
        ) &&
        !deletableSet.has(
          productId
        )
    );

  for (
    const chunk of
    chunkArray(
      deactivatableProductIds,
      BULK_CHUNK_SIZE
    )
  ) {
    const result =
      await prisma.product.updateMany({
        where: {
          id: {
            in:
              chunk,
          },
        },

        data: {
          active:
            false,

          published:
            false,
        },
      });

    stats.deactivatedProducts +=
      result.count;
  }
}

async function buildBrandCache(
  prisma:
    PrismaClient
): Promise<
  Map<
    string,
    {
      id: number;
      name: string;
    }
  >
> {
  /*
   * On précharge uniquement les marques actives.
   *
   * Une marque inactive n'est volontairement pas mise
   * en cache : upsertBrand() pourra alors la retrouver
   * et la réactiver selon sa logique existante.
   */
  const brands =
    await prisma.brand.findMany({
      where: {
        active:
          true,
      },

      select: {
        id:
          true,

        name:
          true,
      },
    });

  const cache =
    new Map<
      string,
      {
        id: number;
        name: string;
      }
    >();

  for (
    const brand of
    brands
  ) {
    const key =
      normalizeBrandKey(
        brand.name
      );

    if (
      key
    ) {
      cache.set(
        key,
        {
          id:
            brand.id,

          name:
            brand.name,
        }
      );
    }
  }

  return cache;
}

async function syncSiteProductsBulk(
  prisma:
    PrismaClient,
  siteId:
    string,
  productIds:
    number[],
  seenAt:
    Date
): Promise<void> {
  const uniqueProductIds =
    Array.from(
      new Set(
        productIds
      )
    );

  if (
    uniqueProductIds.length === 0
  ) {
    return;
  }

  for (
    const chunk of
    chunkArray(
      uniqueProductIds,
      BULK_CHUNK_SIZE
    )
  ) {
    /*
     * updateMany réactive les lignes existantes.
     * createMany crée uniquement les associations absentes.
     */
	await Promise.all([
	  prisma.siteProduct.updateMany({
		where: {
		  siteId,

		  productId: {
			in: chunk,
		  },
		},

		data: {
		  published: true,
		  active: true,

		  lastSeenAt:
			seenAt,

		  archivedAt:
			null,
		},
	  }),

	  prisma.siteProduct.createMany({
		data:
		  chunk.map(
			(productId) => ({
			  siteId,
			  productId,

			  published: true,
			  active: true,

			  firstSeenAt:
				seenAt,

			  lastSeenAt:
				seenAt,
			})
		  ),

		skipDuplicates:
		  true,
	  }),
	]);
  }
}

function chunkArray<T>(
  values:
    T[],
  size:
    number
): T[][] {
  const chunks:
    T[][] = [];

  for (
    let index = 0;
    index <
    values.length;
    index += size
  ) {
    chunks.push(
      values.slice(
        index,
        index + size
      )
    );
  }

  return chunks;
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