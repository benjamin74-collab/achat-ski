import type {
  CategoryEnrichmentMatchMode,
  PrismaClient,
} from "@prisma/client";

import type {
  CategoryResolution,
  MappedCategory,
  NormalizedFeedItem,
} from "./feed-types";

import type {
  FeedCategoryMappings,
} from "./category-mapping";

import {
  normalizeText,
} from "./normalize";

export type RuntimeCategoryEnrichmentRule = {
  id: number;
  name: string;

  sourceCategoryId: number | null;
  targetCategoryId: number;

  includeTerms: string[];
  excludeTerms: string[];

  matchMode: CategoryEnrichmentMatchMode;

  searchTitle: boolean;
  searchDescription: boolean;
  searchCategoryPath: boolean;
  searchBrand: boolean;

  makePrimary: boolean;
  priority: number;
};

/**
 * Charge les règles d’enrichissement actives :
 *
 * - règles globales au site : feedSourceId = null ;
 * - règles spécifiques au flux courant.
 */
export async function loadCategoryEnrichmentRules(
  prisma: PrismaClient,
  siteId: string,
  feedSourceId: number
): Promise<
  RuntimeCategoryEnrichmentRule[]
> {
  const rules =
    await prisma.categoryEnrichmentRule.findMany({
      where: {
        siteId,
        active: true,

        AND: [
          {
            OR: [
              {
                feedSourceId: null,
              },
              {
                feedSourceId,
              },
            ],
          },

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
    ...rule,

    includeTerms: rule.includeTerms
      .map(normalizeSearchValue)
      .filter(Boolean),

    excludeTerms: rule.excludeTerms
      .map(normalizeSearchValue)
      .filter(Boolean),
  }));
}

/**
 * Applique les règles dynamiques après le mapping marchand.
 *
 * Une règle peut :
 *
 * - exiger que le produit appartienne déjà à une catégorie source ;
 * - rechercher des mots dans différents champs ;
 * - ajouter une catégorie cible et tous ses parents ;
 * - remplacer ou non la catégorie principale.
 */
export function enrichFeedCategories(
  item: NormalizedFeedItem,
  resolution: CategoryResolution,
  source: FeedCategoryMappings,
  rules: RuntimeCategoryEnrichmentRule[]
): CategoryResolution {
  if (rules.length === 0) {
    return resolution;
  }

  const resolvedCategories = new Map<
    number,
    MappedCategory
  >(
    resolution.categories.map(
      (category) => [
        category.id,
        category,
      ]
    )
  );

  let primaryCategory =
    resolution.primaryCategory;

  let primaryRulePriority =
    Number.NEGATIVE_INFINITY;

  for (const rule of rules) {
    if (
      !ruleCanApplyToCategories(
        rule,
        resolvedCategories
      )
    ) {
      continue;
    }

    const searchableText =
      buildSearchableText(
        item,
        rule
      );

    if (!searchableText) {
      continue;
    }

    if (
      containsExcludedTerm(
        searchableText,
        rule.excludeTerms
      )
    ) {
      continue;
    }

    if (
      !matchesIncludedTerms(
        searchableText,
        rule.includeTerms,
        rule.matchMode
      )
    ) {
      continue;
    }

    const targetCategory =
      source.categoriesById.get(
        rule.targetCategoryId
      );

    if (!targetCategory) {
      console.warn(
        `[category-enrichment] Catégorie cible ${rule.targetCategoryId} introuvable pour la règle "${rule.name}".`
      );

      continue;
    }

    addCategoryAndAncestors(
      targetCategory.id,
      source,
      resolvedCategories
    );

    /*
     * Les règles sont déjà triées par priorité décroissante.
     * La règle la plus prioritaire pouvant devenir principale
     * conserve donc la priorité.
     */
    if (
      rule.makePrimary &&
      rule.priority >
        primaryRulePriority
    ) {
      primaryCategory = {
        id: targetCategory.id,
        slug: targetCategory.slug,
        name: targetCategory.name,
      };

      primaryRulePriority =
        rule.priority;
    }
  }

  return {
    primaryCategory,

    categories: [
      primaryCategory,

      ...Array.from(
        resolvedCategories.values()
      ).filter(
        (category) =>
          category.id !==
          primaryCategory.id
      ),
    ],
  };
}

function ruleCanApplyToCategories(
  rule: RuntimeCategoryEnrichmentRule,
  resolvedCategories: Map<
    number,
    MappedCategory
  >
): boolean {
  if (
    rule.sourceCategoryId === null
  ) {
    return true;
  }

  return resolvedCategories.has(
    rule.sourceCategoryId
  );
}

function buildSearchableText(
  item: NormalizedFeedItem,
  rule: RuntimeCategoryEnrichmentRule
): string {
  const values: Array<
    string | undefined
  > = [];

  if (rule.searchTitle) {
    values.push(
      item.title,
      item.cleanName
    );
  }

  if (rule.searchDescription) {
    values.push(
      item.description
    );
  }

  if (rule.searchCategoryPath) {
    values.push(
      item.categoryPath
    );
  }

  if (rule.searchBrand) {
    values.push(
      item.brand
    );
  }

  return normalizeSearchValue(
    values
      .filter(
        (
          value
        ): value is string =>
          Boolean(value)
      )
      .join(" ")
  );
}

function matchesIncludedTerms(
  searchableText: string,
  includeTerms: string[],
  matchMode: CategoryEnrichmentMatchMode
): boolean {
  /*
   * Une règle sans terme d’inclusion ne doit pas s’appliquer
   * automatiquement à tous les produits.
   */
  if (includeTerms.length === 0) {
    return false;
  }

  if (matchMode === "ALL") {
    return includeTerms.every(
      (term) =>
        searchableText.includes(term)
    );
  }

  return includeTerms.some(
    (term) =>
      searchableText.includes(term)
  );
}

function containsExcludedTerm(
  searchableText: string,
  excludeTerms: string[]
): boolean {
  if (excludeTerms.length === 0) {
    return false;
  }

  return excludeTerms.some(
    (term) =>
      searchableText.includes(term)
  );
}

function normalizeSearchValue(
  value: string | null | undefined
): string {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function addCategoryAndAncestors(
  categoryId: number,
  source: FeedCategoryMappings,
  resolvedCategories: Map<
    number,
    MappedCategory
  >
): void {
  const visited =
    new Set<number>();

  let currentId: number | null =
    categoryId;

  while (currentId !== null) {
    if (visited.has(currentId)) {
      console.warn(
        `[category-enrichment] Boucle détectée dans la hiérarchie de la catégorie ${currentId}.`
      );

      break;
    }

    visited.add(currentId);

    const category =
      source.categoriesById.get(
        currentId
      );

    if (!category) {
      break;
    }

    resolvedCategories.set(
      category.id,
      {
        id: category.id,
        slug: category.slug,
        name: category.name,
      }
    );

    currentId =
      category.parentId;
  }
}