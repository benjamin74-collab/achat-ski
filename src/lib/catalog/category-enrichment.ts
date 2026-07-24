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

type CategoryRule = {
  categorySlug: string;
  requiredParentSlugs?: string[];
  patterns: RegExp[];
};

/**
 * Règles complémentaires appliquées après le mapping marchand.
 *
 * Elles ne remplacent pas le mapping du flux :
 * elles ajoutent une catégorie plus précise lorsque le contenu
 * du produit apporte une information absente du chemin marchand.
 */
const CATEGORY_ENRICHMENT_RULES: CategoryRule[] = [
  {
    categorySlug: "casques-ski-avec-visiere",

    requiredParentSlugs: [
      "casques-ski",
      "casque-ski",
    ],

    patterns: [
      /\bcasque\s+(?:de\s+)?ski\s+(?:avec\s+)?visiere\b/i,
      /\bcasque\s+a\s+visiere\b/i,
      /\bvisiere\s+integree\b/i,
      /\bvisor\s+helmet\b/i,
      /\bhelmet\s+with\s+visor\b/i,
      /\becran\s+integre\b/i,
      /\bmasque\s+integre\b/i,
    ],
  },
];

export function enrichFeedCategories(
  item: NormalizedFeedItem,
  resolution: CategoryResolution,
  source: FeedCategoryMappings
): CategoryResolution {
  const searchableText = normalizeText(
    [
      item.title,
      item.cleanName,
      item.description,
      item.categoryPath,
    ]
      .filter(Boolean)
      .join(" ")
  ).toLowerCase();

  if (!searchableText) {
    return resolution;
  }

  const resolvedCategories = new Map<
    number,
    MappedCategory
  >(
    resolution.categories.map((category) => [
      category.id,
      category,
    ])
  );

  let primaryCategory =
    resolution.primaryCategory;

  for (const rule of CATEGORY_ENRICHMENT_RULES) {
    const matchesText = rule.patterns.some(
      (pattern) => pattern.test(searchableText)
    );

    if (!matchesText) {
      continue;
    }

    const category = findCategoryBySlug(
      source,
      rule.categorySlug
    );

    if (!category) {
      console.warn(
        `[category-enrichment] Catégorie introuvable : ${rule.categorySlug}`
      );

      continue;
    }

    if (
      rule.requiredParentSlugs?.length &&
      !hasOneOfCategorySlugs(
        resolution.categories,
        rule.requiredParentSlugs
      )
    ) {
      continue;
    }

    addCategoryAndAncestors(
      category.id,
      source,
      resolvedCategories
    );

    /*
     * La règle étant plus précise que le mapping générique,
     * elle devient la catégorie principale.
     */
    primaryCategory = {
      id: category.id,
      slug: category.slug,
      name: category.name,
    };
  }

  return {
    primaryCategory,

    categories: [
      primaryCategory,

      ...Array.from(
        resolvedCategories.values()
      ).filter(
        (category) =>
          category.id !== primaryCategory.id
      ),
    ],
  };
}

function findCategoryBySlug(
  source: FeedCategoryMappings,
  slug: string
) {
  return Array.from(
    source.categoriesById.values()
  ).find(
    (category) =>
      category.slug === slug
  );
}

function hasOneOfCategorySlugs(
  categories: MappedCategory[],
  expectedSlugs: string[]
): boolean {
  return categories.some((category) =>
    expectedSlugs.includes(category.slug)
  );
}

function addCategoryAndAncestors(
  categoryId: number,
  source: FeedCategoryMappings,
  resolvedCategories: Map<
    number,
    MappedCategory
  >
): void {
  const visited = new Set<number>();

  let currentId: number | null =
    categoryId;

  while (currentId !== null) {
    if (visited.has(currentId)) {
      break;
    }

    visited.add(currentId);

    const category =
      source.categoriesById.get(currentId);

    if (!category) {
      break;
    }

    resolvedCategories.set(category.id, {
      id: category.id,
      slug: category.slug,
      name: category.name,
    });

    currentId = category.parentId;
  }
}