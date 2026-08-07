// prisma/reclassify-products.ts
import { Prisma } from "@prisma/client";

import { prisma } from "../src/lib/prisma";

import {
  enrichFeedCategories,
  type RuntimeCategoryEnrichmentRule,
} from "../src/lib/catalog/category-enrichment";

import type {
  CategoryResolution,
  MappedCategory,
  MerchantPlatform,
  NormalizedFeedItem,
} from "../src/lib/catalog/feed-types";

import type {
  FeedCategoryMappings,
} from "../src/lib/catalog/category-mapping";

type CliOptions = {
  siteId: string;
  batchSize: number;
  limit: number | null;
  dryRun: boolean;
  replace: boolean;
  productId: number | null;
};

type CategoryTreeEntry = MappedCategory & {
  parentId: number | null;
};

type ProductForReclassification =
  Prisma.ProductGetPayload<{
    select: {
      id: true;
      name: true;
      model: true;
      brand: true;
      description: true;
      manufacturerReference: true;
      gtin: true;
      imageUrl: true;
      categoryId: true;
      attributes: true;

      categories: {
        select: {
          categoryId: true;
        };
      };

      offers: {
        select: {
          id: true;
          feedKey: true;
          externalId: true;
          parentExternalId: true;
          merchantProductUrl: true;
          affiliateUrl: true;
          priceCents: true;
          oldPriceCents: true;
          shippingCents: true;
          currency: true;
          availability: true;
          inStock: true;
          imageUrl: true;

          merchant: {
            select: {
              slug: true;
              platform: true;
            };
          };
        };
      };
    };
  }>;

type ReclassificationStats = {
  scannedProducts: number;
  changedProducts: number;
  unchangedProducts: number;

  skippedWithoutCategory: number;
  skippedWithoutRules: number;

  primaryCategoryChanged: number;
  categoryRelationsAdded: number;
  categoryRelationsRemoved: number;

  errors: number;
};

type ReclassificationResult = {
  primaryCategory: MappedCategory;
  categories: MappedCategory[];
  addedCategoryIds: number[];
  removedCategoryIds: number[];
  primaryChanged: boolean;
  changed: boolean;
};

const DEFAULT_SITE_ID = "meilleur-ski";
const DEFAULT_BATCH_SIZE = 200;

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    siteId:
      process.env.SITE_ID ||
      DEFAULT_SITE_ID,

    batchSize:
      Number(process.env.BATCH_SIZE) ||
      DEFAULT_BATCH_SIZE,

    limit: null,
    dryRun: false,
    replace: false,
    productId: null,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--replace") {
      options.replace = true;
      continue;
    }

    if (arg.startsWith("--site=")) {
      options.siteId = arg.replace("--site=", "").trim();
      continue;
    }

    if (arg.startsWith("--batch=")) {
      const value = Number(arg.replace("--batch=", ""));

      if (Number.isInteger(value) && value > 0) {
        options.batchSize = value;
      }

      continue;
    }

    if (arg.startsWith("--limit=")) {
      const value = Number(arg.replace("--limit=", ""));

      if (Number.isInteger(value) && value > 0) {
        options.limit = value;
      }

      continue;
    }

    if (arg.startsWith("--product=")) {
      const value = Number(arg.replace("--product=", ""));

      if (Number.isInteger(value) && value > 0) {
        options.productId = value;
      }

      continue;
    }
  }

  return options;
}

async function main() {
  const options =
    parseArgs(process.argv.slice(2));

  console.log("");
  console.log("============================================================");
  console.log("Reclassification catalogue");
  console.log("============================================================");
  console.log(`Site       : ${options.siteId}`);
  console.log(`Batch      : ${options.batchSize}`);
  console.log(`Limit      : ${options.limit ?? "aucune"}`);
  console.log(`Produit    : ${options.productId ?? "tous"}`);
  console.log(`Dry run    : ${options.dryRun ? "oui" : "non"}`);
  console.log(`Replace    : ${options.replace ? "oui" : "non"}`);
  console.log("============================================================");
  console.log("");

  const stats: ReclassificationStats = {
    scannedProducts: 0,
    changedProducts: 0,
    unchangedProducts: 0,

    skippedWithoutCategory: 0,
    skippedWithoutRules: 0,

    primaryCategoryChanged: 0,
    categoryRelationsAdded: 0,
    categoryRelationsRemoved: 0,

    errors: 0,
  };

  const categorySource =
    await loadCategorySource();

  const feedSources =
    await loadFeedSources(options.siteId);

  const allActiveRules =
    await loadActiveRules(options.siteId);

  if (allActiveRules.length === 0) {
    console.log(
      `Aucune règle active trouvée pour le site "${options.siteId}".`
    );

    await prisma.$disconnect();
    return;
  }

  console.log(
    `${allActiveRules.length} règle(s) active(s) chargée(s).`
  );

  let cursorId = 0;
  let processed = 0;

  while (true) {
    const remaining =
      options.limit === null
        ? options.batchSize
        : Math.min(
            options.batchSize,
            options.limit - processed
          );

    if (remaining <= 0) {
      break;
    }

    const products =
      await loadProductBatch(
        options,
        cursorId,
        remaining
      );

    if (products.length === 0) {
      break;
    }

    for (const product of products) {
      cursorId =
        Math.max(cursorId, product.id);

      stats.scannedProducts += 1;
      processed += 1;

      try {
        const result =
          reclassifyProduct({
            product,
            categorySource,
            feedSources,
            allActiveRules,
            replace: options.replace,
          });

        if (!result) {
          stats.skippedWithoutCategory += 1;
          continue;
        }

        if (!result.changed) {
          stats.unchangedProducts += 1;
          continue;
        }

        stats.changedProducts += 1;

        if (result.primaryChanged) {
          stats.primaryCategoryChanged += 1;
        }

        stats.categoryRelationsAdded +=
          result.addedCategoryIds.length;

        stats.categoryRelationsRemoved +=
          result.removedCategoryIds.length;

        if (!options.dryRun) {
          await applyReclassification(
            product,
            result,
            options.replace
          );
        }

        logProductChange(product, result);
      } catch (error) {
        stats.errors += 1;

        console.error(
          `[reclassify] Produit ${product.id} "${product.name}"`,
          error
        );
      }
    }

    console.log(
      `Progression : ${stats.scannedProducts} produit(s) analysé(s), ${stats.changedProducts} modifié(s).`
    );

    if (options.productId) {
      break;
    }
  }

  console.log("");
  console.log("============================================================");
  console.log("Résultat reclassification");
  console.log("============================================================");
  console.log(`Produits analysés         : ${stats.scannedProducts}`);
  console.log(`Produits modifiés         : ${stats.changedProducts}`);
  console.log(`Produits inchangés        : ${stats.unchangedProducts}`);
  console.log(`Sans catégorie de départ  : ${stats.skippedWithoutCategory}`);
  console.log(`Sans règle applicable     : ${stats.skippedWithoutRules}`);
  console.log(`Principale corrigée       : ${stats.primaryCategoryChanged}`);
  console.log(`Relations ajoutées        : ${stats.categoryRelationsAdded}`);
  console.log(`Relations supprimées      : ${stats.categoryRelationsRemoved}`);
  console.log(`Erreurs                   : ${stats.errors}`);
  console.log("============================================================");
  console.log("");

  if (options.dryRun) {
    console.log(
      "Mode dry-run : aucune modification n'a été écrite en base."
    );
    console.log("");
  }

  await prisma.$disconnect();
}

async function loadProductBatch(
  options: CliOptions,
  cursorId: number,
  take: number
): Promise<ProductForReclassification[]> {
  return prisma.product.findMany({
    where: {
      ...(options.productId
        ? {
            id: options.productId,
          }
        : {
            id: {
              gt: cursorId,
            },
          }),

      active: true,
      published: true,

      sites: {
        some: {
          siteId: options.siteId,
          active: true,
          published: true,
        },
      },
    },

    orderBy: {
      id: "asc",
    },

    take,

    select: {
      id: true,
      name: true,
      model: true,
      brand: true,
      description: true,
      manufacturerReference: true,
      gtin: true,
      imageUrl: true,
      categoryId: true,
      attributes: true,

      categories: {
        select: {
          categoryId: true,
        },
      },

      offers: {
        where: {
          active: true,
        },

        orderBy: [
          {
            lastSeen: "desc",
          },
          {
            id: "desc",
          },
        ],

        select: {
          id: true,
          feedKey: true,
          externalId: true,
          parentExternalId: true,
          merchantProductUrl: true,
          affiliateUrl: true,
          priceCents: true,
          oldPriceCents: true,
          shippingCents: true,
          currency: true,
          availability: true,
          inStock: true,
          imageUrl: true,

          merchant: {
            select: {
              slug: true,
              platform: true,
            },
          },
        },
      },
    },
  });
}

async function loadCategorySource(): Promise<FeedCategoryMappings> {
  const categories =
    await prisma.category.findMany({
      where: {
        published: true,
      },

      select: {
        id: true,
        slug: true,
        name: true,
        parentId: true,
      },
    });

  const categoriesById =
    new Map<number, CategoryTreeEntry>();

  for (const category of categories) {
    categoriesById.set(category.id, {
      id: category.id,
      slug: category.slug,
      name: category.name,
      parentId: category.parentId,
    });
  }

  return {
    mappings: [],
    categoriesById,
  };
}

async function loadFeedSources(siteId: string) {
  const feedSources =
    await prisma.feedSource.findMany({
      where: {
        siteId,
        active: true,
      },

      select: {
        id: true,
        slug: true,
        name: true,
      },
    });

  const byFeedKey =
    new Map<string, { id: number; slug: string; name: string }>();

  const bySlug =
    new Map<string, { id: number; slug: string; name: string }>();

  for (const feedSource of feedSources) {
    byFeedKey.set(
      `${siteId}:${feedSource.slug}`,
      feedSource
    );

    bySlug.set(
      feedSource.slug,
      feedSource
    );
  }

  return {
    list: feedSources,
    byFeedKey,
    bySlug,
  };
}

async function loadActiveRules(
  siteId: string
): Promise<RuntimeCategoryEnrichmentRule[]> {
  const rules =
    await prisma.categoryEnrichmentRule.findMany({
      where: {
        siteId,
        active: true,

        AND: [
          {
            OR: [
              {
                sourceCategoryId: null,
              },
              {
                sourceCategory: {
                  is: {
                    published: true,
                  },
                },
              },
            ],
          },
        ],

        targetCategory: {
          published: true,
        },
      },

      select: {
        id: true,
        name: true,

        feedSourceId: true,
        sourceCategoryId: true,
        targetCategoryId: true,

        includeTerms: true,
        excludeTerms: true,

        matchMode: true,

        searchTitle: true,
        searchDescription: true,
        searchCategoryPath: true,
        searchBrand: true,

        makePrimary: true,
        priority: true,
      },

      orderBy: [
        {
          priority: "desc",
        },
        {
          id: "asc",
        },
      ],
    });

  return rules.map((rule) => ({
    id: rule.id,
    name: rule.name,

    sourceCategoryId:
      rule.sourceCategoryId,

    targetCategoryId:
      rule.targetCategoryId,

    includeTerms:
      rule.includeTerms
        .map(normalizeSearchValue)
        .filter(Boolean),

    excludeTerms:
      rule.excludeTerms
        .map(normalizeSearchValue)
        .filter(Boolean),

    matchMode:
      rule.matchMode,

    searchTitle:
      rule.searchTitle,

    searchDescription:
      rule.searchDescription,

    searchCategoryPath:
      rule.searchCategoryPath,

    searchBrand:
      rule.searchBrand,

    makePrimary:
      rule.makePrimary,

    priority:
      rule.priority,

    /*
     * Propriété interne conservée par cast dans filterRulesForProduct().
     * RuntimeCategoryEnrichmentRule ne l'expose pas, car enrichFeedCategories()
     * n'en a plus besoin une fois les règles filtrées.
     */
    feedSourceId:
      rule.feedSourceId,
  } as RuntimeCategoryEnrichmentRule & {
    feedSourceId: number | null;
  }));
}

function reclassifyProduct({
  product,
  categorySource,
  feedSources,
  allActiveRules,
  replace,
}: {
  product: ProductForReclassification;
  categorySource: FeedCategoryMappings;
  feedSources: Awaited<ReturnType<typeof loadFeedSources>>;
  allActiveRules: RuntimeCategoryEnrichmentRule[];
  replace: boolean;
}): ReclassificationResult | null {
  const initialResolution =
    buildInitialCategoryResolution(
      product,
      categorySource
    );

  if (!initialResolution) {
    return null;
  }

  const rules =
    filterRulesForProduct(
      product,
      feedSources,
      allActiveRules
    );

  if (rules.length === 0) {
    return {
      primaryCategory:
        initialResolution.primaryCategory,

      categories:
        initialResolution.categories,

      addedCategoryIds: [],
      removedCategoryIds: [],
      primaryChanged: false,
      changed: false,
    };
  }

  const normalizedItem =
    buildNormalizedItem(product);

  const enrichedResolution =
    enrichFeedCategories(
      normalizedItem,
      initialResolution,
      categorySource,
      rules
    );

  const existingCategoryIds =
    uniqueNumbers([
      product.categoryId,
      ...product.categories.map(
        (category) => category.categoryId
      ),
    ]);

  const nextCategoryIds =
    uniqueNumbers(
      enrichedResolution.categories.map(
        (category) => category.id
      )
    );

  const addedCategoryIds =
    nextCategoryIds.filter(
      (categoryId) =>
        !existingCategoryIds.includes(categoryId)
    );

  const removedCategoryIds =
    replace
      ? existingCategoryIds.filter(
          (categoryId) =>
            !nextCategoryIds.includes(categoryId)
        )
      : [];

  const primaryChanged =
    product.categoryId !==
    enrichedResolution.primaryCategory.id;

  const changed =
    primaryChanged ||
    addedCategoryIds.length > 0 ||
    removedCategoryIds.length > 0;

  return {
    primaryCategory:
      enrichedResolution.primaryCategory,

    categories:
      enrichedResolution.categories,

    addedCategoryIds,
    removedCategoryIds,
    primaryChanged,
    changed,
  };
}

function buildInitialCategoryResolution(
  product: ProductForReclassification,
  categorySource: FeedCategoryMappings
): CategoryResolution | null {
  const currentCategoryIds =
    uniqueNumbers([
      product.categoryId,
      ...product.categories.map(
        (category) => category.categoryId
      ),
    ]);

  if (currentCategoryIds.length === 0) {
    return null;
  }

  const expandedCategoryIds =
    expandCategoryIdsWithAncestors(
      currentCategoryIds,
      categorySource
    );

  const categories =
    expandedCategoryIds
      .map((categoryId) =>
        categorySource.categoriesById.get(categoryId)
      )
      .filter(
        (
          category
        ): category is CategoryTreeEntry =>
          Boolean(category)
      )
      .map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
      }));

  if (categories.length === 0) {
    return null;
  }

  const primaryFromProduct =
    product.categoryId
      ? categorySource.categoriesById.get(
          product.categoryId
        )
      : null;

  const primaryCategory =
    primaryFromProduct
      ? {
          id: primaryFromProduct.id,
          slug: primaryFromProduct.slug,
          name: primaryFromProduct.name,
        }
      : categories[0];

  if (!primaryCategory) {
    return null;
  }

  return {
    primaryCategory,
    categories: [
      primaryCategory,
      ...categories.filter(
        (category) =>
          category.id !== primaryCategory.id
      ),
    ],
  };
}

function expandCategoryIdsWithAncestors(
  categoryIds: number[],
  categorySource: FeedCategoryMappings
): number[] {
  const result = new Set<number>();

  for (const categoryId of categoryIds) {
    let currentId: number | null =
      categoryId;

    const visited =
      new Set<number>();

    while (currentId !== null) {
      if (visited.has(currentId)) {
        break;
      }

      visited.add(currentId);

      const category =
        categorySource.categoriesById.get(
          currentId
        );

      if (!category) {
        break;
      }

      result.add(category.id);

      currentId =
        category.parentId;
    }
  }

  return Array.from(result);
}

function filterRulesForProduct(
  product: ProductForReclassification,
  feedSources: Awaited<ReturnType<typeof loadFeedSources>>,
  rules: RuntimeCategoryEnrichmentRule[]
): RuntimeCategoryEnrichmentRule[] {
  const feedSourceIds =
    new Set<number>();

  for (const offer of product.offers) {
    if (offer.feedKey) {
      const feedSource =
        feedSources.byFeedKey.get(
          offer.feedKey
        );

      if (feedSource) {
        feedSourceIds.add(feedSource.id);
      }
    }
  }

  return rules.filter((rule) => {
    const scopedRule =
      rule as RuntimeCategoryEnrichmentRule & {
        feedSourceId?: number | null;
      };

    if (
      scopedRule.feedSourceId === null ||
      scopedRule.feedSourceId === undefined
    ) {
      return true;
    }

    return feedSourceIds.has(
      scopedRule.feedSourceId
    );
  });
}

function buildNormalizedItem(
  product: ProductForReclassification
): NormalizedFeedItem {
  const preferredOffer =
    product.offers[0];

  const attributes =
    jsonObject(product.attributes);

  const sourceCategoryPath =
    getStringFromJson(
      attributes,
      "sourceCategoryPath"
    );

  const sourceGroupKey =
    getStringFromJson(
      attributes,
      "sourceGroupKey"
    );

  return {
    merchantSlug:
      preferredOffer?.merchant.slug ??
      "unknown",

    merchantPlatform:
      toMerchantPlatform(
        preferredOffer?.merchant.platform
      ),

    externalId:
      preferredOffer?.externalId ??
      undefined,

    parentExternalId:
      preferredOffer?.parentExternalId ??
      undefined,

    manufacturerReference:
      product.manufacturerReference ??
      undefined,

	title:
	  product.name ?? "",

	cleanName:
	  product.name ?? 
	  undefined,

    brand:
      product.brand ??
      undefined,

    description:
      product.description ??
      undefined,

    categoryPath:
      sourceCategoryPath ??
      sourceGroupKey ??
      undefined,

    gtin:
      product.gtin ??
      undefined,

    price:
      centsToPrice(
        preferredOffer?.priceCents
      ),

    oldPrice:
      preferredOffer?.oldPriceCents
        ? centsToPrice(
            preferredOffer.oldPriceCents
          )
        : undefined,

    shippingCost:
      preferredOffer?.shippingCents
        ? centsToPrice(
            preferredOffer.shippingCents
          )
        : undefined,

    currency:
      preferredOffer?.currency ??
      "EUR",

    availability:
      preferredOffer?.availability ??
      undefined,

    inStock:
      preferredOffer?.inStock ??
      true,

    affiliateUrl:
      preferredOffer?.affiliateUrl ??
      "",

    merchantProductUrl:
      preferredOffer?.merchantProductUrl ??
      undefined,

    imageUrl:
      preferredOffer?.imageUrl ??
      product.imageUrl ??
      undefined,

    rawData:
      attributes,
  };
}

async function applyReclassification(
  product: ProductForReclassification,
  result: ReclassificationResult,
  replace: boolean
): Promise<void> {
  const nextCategoryIds =
    uniqueNumbers([
      result.primaryCategory.id,
      ...result.categories.map(
        (category) => category.id
      ),
    ]);

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: {
        id: product.id,
      },

      data: {
        categoryId:
          result.primaryCategory.id,

        attributes:
          buildNextAttributes(
            product.attributes,
            result
          ),
      },
    });

    if (replace) {
      await tx.productCategory.deleteMany({
        where: {
          productId: product.id,
          categoryId: {
            notIn: nextCategoryIds,
          },
        },
      });
    }

    await tx.productCategory.updateMany({
      where: {
        productId: product.id,
        isPrimary: true,
      },

      data: {
        isPrimary: false,
      },
    });

    for (const categoryId of nextCategoryIds) {
      await tx.productCategory.upsert({
        where: {
          productId_categoryId: {
            productId: product.id,
            categoryId,
          },
        },

        update: {
          isPrimary:
            categoryId ===
            result.primaryCategory.id,
        },

        create: {
          productId:
            product.id,

          categoryId,

          isPrimary:
            categoryId ===
            result.primaryCategory.id,
        },
      });
    }
  });
}

function buildNextAttributes(
  currentAttributes: Prisma.JsonValue,
  result: ReclassificationResult
): Prisma.InputJsonValue {
  const base =
    jsonObject(currentAttributes);

  return {
    ...base,

    primaryCategorySlug:
      result.primaryCategory.slug,

    categorySlugs:
      result.categories.map(
        (category) => category.slug
      ),

    categoryIds:
      result.categories.map(
        (category) => category.id
      ),

    reclassifiedAt:
      new Date().toISOString(),

    reclassifiedBy:
      "prisma/reclassify-products.ts",
  };
}

function logProductChange(
  product: ProductForReclassification,
  result: ReclassificationResult
) {
  const added =
    result.addedCategoryIds.length > 0
      ? ` +${result.addedCategoryIds.join(",")}`
      : "";

  const removed =
    result.removedCategoryIds.length > 0
      ? ` -${result.removedCategoryIds.join(",")}`
      : "";

  const primary =
    result.primaryChanged
      ? ` primary:${product.categoryId ?? "null"}→${result.primaryCategory.id}`
      : "";

  console.log(
    `[OK] #${product.id} ${product.name}${primary}${added}${removed}`
  );
}

function normalizeSearchValue(
  value: string | null | undefined
): string {
  if (!value) {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueNumbers(
  values: Array<number | null | undefined>
): number[] {
  return Array.from(
    new Set(
      values.filter(
        (value): value is number =>
          Number.isInteger(value) &&
          value > 0
      )
    )
  );
}

function jsonObject(
  value: Prisma.JsonValue
): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function getStringFromJson(
  object: Record<string, unknown>,
  key: string
): string | null {
  const value =
    object[key];

  if (typeof value !== "string") {
    return null;
  }

  const trimmed =
    value.trim();

  return trimmed || null;
}

function centsToPrice(
  value: number | null | undefined
): number {
  if (!value) {
    return 0;
  }

  return value / 100;
}

function toMerchantPlatform(
  value: string | null | undefined
): MerchantPlatform {
  if (
    value === "KWANKO" ||
    value === "AWIN" ||
    value === "AFFILAE" ||
    value === "DIRECT" ||
    value === "OTHER"
  ) {
    return value;
  }

  return "OTHER";
}

main().catch(async (error) => {
  console.error("");
  console.error("Erreur reclassification catalogue :");
  console.error(error);
  console.error("");

  await prisma.$disconnect();

  process.exit(1);
});
