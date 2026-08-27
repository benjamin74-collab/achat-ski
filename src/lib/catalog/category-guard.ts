import type {
  AggregatedFeedItem,
  MappedCategory,
} from "./feed-types";

import type {
  FeedCategoryMappings,
} from "./category-mapping";

import {
  normalizeText,
} from "./normalize";

type GuardedCategoryPlan = {
  primarySlug: string;
  allowedSlugs: string[];
  cleanupSlugs: string[];
};

const SNOWBOARD_EXCLUSIVE_SLUGS = [
  "snowboard",

  "planches-snowboard",
  "snowboard-freestyle",
  "snowboard-all-mountain",
  "snowboard-freeride",

  "packs-snowboard",

  "splitboard",

  "boots-snowboard",
  "boots-snowboard-freestyle",
  "boots-snowboard-freeride",

  "fixations-snowboard",
  "fixations-snowboard-straps",
  "fixations-snowboard-rear-entry",
  "fixations-splitboard",

  "housses-snowboard",
  "accessoires-snowboard",
];

export function applyCategoryGuardToAggregatedItems(
  items: AggregatedFeedItem[],
  source: FeedCategoryMappings
): AggregatedFeedItem[] {
  return items.map((item) =>
    applyCategoryGuard(item, source)
  );
}

function applyCategoryGuard(
  aggregated: AggregatedFeedItem,
  source: FeedCategoryMappings
): AggregatedFeedItem {
  const snowboardPlan =
    buildSnowboardCategoryPlan(aggregated);

  if (!snowboardPlan) {
    return aggregated;
  }

  const primaryCategory =
    findCategoryBySlug(
      source,
      snowboardPlan.primarySlug
    );

  if (!primaryCategory) {
    return aggregated;
  }

  const categories =
    resolveCategoriesWithAncestors(
      source,
      snowboardPlan.allowedSlugs
    );

  const cleanupIds =
    snowboardPlan.cleanupSlugs
      .map((slug) =>
        findCategoryBySlug(source, slug)?.id
      )
      .filter(
        (id): id is number =>
          typeof id === "number"
      );

  return {
    ...aggregated,
    primaryCategory,
    categories,
    categoryCleanupIds: cleanupIds,
  };
}

function buildSnowboardCategoryPlan(
  aggregated: AggregatedFeedItem
): GuardedCategoryPlan | null {
  const path = normalizeCategoryPath(
    aggregated.item.categoryPath
  );

  const currentPrimarySlug =
    aggregated.primaryCategory.slug;

  if (
    path.includes(
      "ekosport > nos univers > snowboard > materiel snowboard > pack snowboard"
    ) ||
    path.includes("snowboard > packs")
  ) {
    return {
      primarySlug: "packs-snowboard",
      allowedSlugs: [
        "packs-snowboard",
      ],
      cleanupSlugs: SNOWBOARD_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > snowboard > materiel snowboard > planche de snowboard"
    ) ||
    path.includes("snowboard > planches")
  ) {
    const allowedSubCategories = [
      "snowboard-freestyle",
      "snowboard-all-mountain",
      "snowboard-freeride",
    ];

    const primarySlug =
      allowedSubCategories.includes(
        currentPrimarySlug
      )
        ? currentPrimarySlug
        : "planches-snowboard";

    return {
      primarySlug,
      allowedSlugs: [
        "planches-snowboard",
        primarySlug,
      ],
      cleanupSlugs: SNOWBOARD_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > snowboard > materiel splitboard > splitboard"
    ) ||
    path.includes("snowboard > splitboard")
  ) {
    return {
      primarySlug: "splitboard",
      allowedSlugs: [
        "splitboard",
      ],
      cleanupSlugs: SNOWBOARD_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > snowboard > materiel snowboard > boots snowboard"
    ) ||
    path.includes("snowboard > boots")
  ) {
    const allowedSubCategories = [
      "boots-snowboard-freestyle",
      "boots-snowboard-freeride",
    ];

    const primarySlug =
      allowedSubCategories.includes(
        currentPrimarySlug
      )
        ? currentPrimarySlug
        : "boots-snowboard";

    return {
      primarySlug,
      allowedSlugs: [
        "boots-snowboard",
        primarySlug,
      ],
      cleanupSlugs: SNOWBOARD_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > snowboard > materiel snowboard > fixation snowboard"
    ) ||
    path.includes("snowboard > fixations")
  ) {
    const allowedSubCategories = [
      "fixations-snowboard-straps",
      "fixations-snowboard-rear-entry",
    ];

    const primarySlug =
      allowedSubCategories.includes(
        currentPrimarySlug
      )
        ? currentPrimarySlug
        : "fixations-snowboard";

    return {
      primarySlug,
      allowedSlugs: [
        "fixations-snowboard",
        primarySlug,
      ],
      cleanupSlugs: SNOWBOARD_EXCLUSIVE_SLUGS,
    };
  }

  if (
    path.includes(
      "ekosport > nos univers > snowboard > accessoire snowboard > housse snowboard"
    ) ||
    path.includes("bagagerie snowboard > housses")
  ) {
    return {
      primarySlug: "housses-snowboard",
      allowedSlugs: [
        "housses-snowboard",
      ],
      cleanupSlugs: SNOWBOARD_EXCLUSIVE_SLUGS,
    };
  }

  return null;
}

function resolveCategoriesWithAncestors(
  source: FeedCategoryMappings,
  slugs: string[]
): MappedCategory[] {
  const resolved = new Map<
    number,
    MappedCategory
  >();

  for (const slug of slugs) {
    const category =
      findCategoryBySlug(source, slug);

    if (!category) {
      continue;
    }

    addCategoryAndAncestors(
      source,
      category.id,
      resolved
    );
  }

  return Array.from(resolved.values());
}

function addCategoryAndAncestors(
  source: FeedCategoryMappings,
  categoryId: number,
  resolved: Map<number, MappedCategory>
): void {
  const visited = new Set<number>();

  let currentId: number | null = categoryId;

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

    resolved.set(category.id, {
      id: category.id,
      slug: category.slug,
      name: category.name,
    });

    currentId = category.parentId;
  }
}

function findCategoryBySlug(
  source: FeedCategoryMappings,
  slug: string
): MappedCategory | null {
  for (const category of source.categoriesById.values()) {
    if (category.slug === slug) {
      return {
        id: category.id,
        slug: category.slug,
        name: category.name,
      };
    }
  }

  return null;
}

function normalizeCategoryPath(
  value: string | null | undefined
): string {
  return normalizeText(value)
    .toLowerCase()
    .replace(
      /\s*(>|\/|\||»|→)\s*/g,
      " > "
    )
    .replace(/\s+/g, " ")
    .trim();
}