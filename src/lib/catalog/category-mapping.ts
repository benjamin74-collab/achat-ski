import type { PrismaClient } from "@prisma/client";

import type {
  CategoryResolution,
  MappedCategory,
} from "./feed-types";

import { normalizeText } from "./normalize";

type CategoryTreeEntry = MappedCategory & {
  parentId: number | null;
};

type CategoryMappingEntry = CategoryTreeEntry & {
  externalPath: string;
  normalizedMapping: string;
  priority: number;
};

export type FeedCategoryMappings = {
  feedSourceId?: number;
  mappings: CategoryMappingEntry[];
  categoriesById: Map<number, CategoryTreeEntry>;
};

/**
 * Alias conservé pour ne pas casser l’import Ekosport existant.
 */
export type EkosportCategoryMappings =
  FeedCategoryMappings;

/**
 * Charge les correspondances universelles d’un flux depuis :
 *
 * CategoryExternalMapping
 *
 * Les catégories parentes sont également chargées afin de pouvoir
 * associer automatiquement un produit à toute sa hiérarchie.
 */
export async function loadFeedCategoryMappings(
  prisma: PrismaClient,
  feedSourceId: number
): Promise<FeedCategoryMappings> {
  const [categories, externalMappings] =
    await Promise.all([
      prisma.category.findMany({
        where: {
          published: true,
        },
        select: {
          id: true,
          slug: true,
          name: true,
          parentId: true,
        },
      }),

      prisma.categoryExternalMapping.findMany({
        where: {
          feedSourceId,
          active: true,
          category: {
            published: true,
          },
        },
        select: {
          externalPath: true,
          normalizedExternalPath: true,
          priority: true,

          category: {
            select: {
              id: true,
              slug: true,
              name: true,
              parentId: true,
            },
          },
        },
        orderBy: [
          {
            priority: "desc",
          },
          {
            normalizedExternalPath: "desc",
          },
        ],
      }),
    ]);

  const categoriesById = new Map<
    number,
    CategoryTreeEntry
  >();

  for (const category of categories) {
    categoriesById.set(category.id, {
      id: category.id,
      slug: category.slug,
      name: category.name,
      parentId: category.parentId,
    });
  }

  const mappings: CategoryMappingEntry[] =
    externalMappings
      .map((mapping) => {
        const normalizedMapping =
          normalizeCategoryPath(
            mapping.normalizedExternalPath ||
              mapping.externalPath
          );

        return {
          id: mapping.category.id,
          slug: mapping.category.slug,
          name: mapping.category.name,
          parentId:
            mapping.category.parentId,

          externalPath:
            mapping.externalPath,

          normalizedMapping,
          priority: mapping.priority,
        };
      })
      .filter(
        (
          mapping
        ): mapping is CategoryMappingEntry =>
          Boolean(mapping.normalizedMapping)
      )
      .sort(compareMappings);

  return {
    feedSourceId,
    mappings,
    categoriesById,
  };
}

/**
 * Résout un chemin de catégorie provenant de n’importe quel flux.
 *
 * La correspondance la plus prioritaire et la plus précise devient
 * la catégorie principale.
 *
 * Toutes les autres correspondances compatibles ainsi que leurs
 * catégories parentes sont conservées comme catégories secondaires.
 */
export function resolveFeedCategories(
  categoryPath: string | null | undefined,
  source: FeedCategoryMappings
): CategoryResolution | null {
  const normalizedPath =
    normalizeCategoryPath(categoryPath);

  if (!normalizedPath) {
    return null;
  }

  const matchingEntries = source.mappings
    .filter(({ normalizedMapping }) =>
      categoryMatches(
        normalizedPath,
        normalizedMapping
      )
    )
    .sort(compareMappings);

  if (matchingEntries.length === 0) {
    return null;
  }

  const mostPreciseMatch =
    matchingEntries[0];

  if (!mostPreciseMatch) {
    return null;
  }

  const primaryCategory: MappedCategory = {
    id: mostPreciseMatch.id,
    slug: mostPreciseMatch.slug,
    name: mostPreciseMatch.name,
  };

  const resolvedCategories = new Map<
    number,
    MappedCategory
  >();

  for (const match of matchingEntries) {
    resolvedCategories.set(match.id, {
      id: match.id,
      slug: match.slug,
      name: match.name,
    });

    addCategoryAndAncestors(
      match.id,
      source.categoriesById,
      resolvedCategories
    );
  }

  const categories = [
    primaryCategory,

    ...Array.from(
      resolvedCategories.values()
    ).filter(
      (category) =>
        category.id !== primaryCategory.id
    ),
  ];

  return {
    primaryCategory,
    categories,
  };
}

/**
 * Retourne uniquement la catégorie principale.
 */
export function resolveFeedCategory(
  categoryPath: string | null | undefined,
  source: FeedCategoryMappings
): MappedCategory | null {
  return (
    resolveFeedCategories(
      categoryPath,
      source
    )?.primaryCategory ?? null
  );
}

/**
 * Compatibilité temporaire avec l’ancien système Ekosport basé
 * sur Category.mapEkosport.
 *
 * Cette fonction pourra être supprimée lorsque tous les mappings
 * Ekosport auront été transférés dans CategoryExternalMapping.
 */
export async function loadEkosportCategoryMappings(
  prisma: PrismaClient
): Promise<EkosportCategoryMappings> {
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
        mapEkosport: true,
      },
    });

  const categoriesById = new Map<
    number,
    CategoryTreeEntry
  >();

  for (const category of categories) {
    categoriesById.set(category.id, {
      id: category.id,
      slug: category.slug,
      name: category.name,
      parentId: category.parentId,
    });
  }

  const mappings: CategoryMappingEntry[] =
    categories
      .flatMap((category) =>
        category.mapEkosport
          .map((externalPath) => ({
            id: category.id,
            slug: category.slug,
            name: category.name,
            parentId: category.parentId,

            externalPath,

            normalizedMapping:
              normalizeCategoryPath(
                externalPath
              ),

            priority: 0,
          }))
      )
      .filter(
        (
          mapping
        ): mapping is CategoryMappingEntry =>
          Boolean(mapping.normalizedMapping)
      )
      .sort(compareMappings);

  return {
    mappings,
    categoriesById,
  };
}

/**
 * Alias Ekosport conservé pendant la transition.
 */
export function resolveEkosportCategories(
  categoryPath: string | null | undefined,
  source: EkosportCategoryMappings
): CategoryResolution | null {
  return resolveFeedCategories(
    categoryPath,
    source
  );
}

/**
 * Alias Ekosport conservé pendant la transition.
 */
export function resolveEkosportCategory(
  categoryPath: string | null | undefined,
  source: EkosportCategoryMappings
): MappedCategory | null {
  return resolveFeedCategory(
    categoryPath,
    source
  );
}

/**
 * Normalise les séparateurs et le texte des chemins marchands.
 *
 * Exemples convertis vers le même format :
 *
 * Ski / Skis piste
 * Ski > Skis piste
 * Ski | Skis piste
 * Ski » Skis piste
 */
export function normalizeCategoryPath(
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

/**
 * Une catégorie correspond lorsque :
 *
 * - le chemin est strictement identique ;
 * - le mapping représente un parent du chemin marchand.
 */
function categoryMatches(
  normalizedPath: string,
  normalizedMapping: string
): boolean {
  return (
    normalizedPath === normalizedMapping ||
    normalizedPath.startsWith(
      `${normalizedMapping} > `
    )
  );
}

/**
 * Trie les mappings selon :
 *
 * 1. la priorité définie dans le back-office ;
 * 2. la précision du chemin.
 */
function compareMappings(
  a: CategoryMappingEntry,
  b: CategoryMappingEntry
): number {
  if (a.priority !== b.priority) {
    return b.priority - a.priority;
  }

  return (
    b.normalizedMapping.length -
    a.normalizedMapping.length
  );
}

/**
 * Ajoute une catégorie et remonte toute sa hiérarchie.
 *
 * Le Set visited protège le moteur contre une éventuelle boucle
 * dans les relations parent/enfant.
 */
function addCategoryAndAncestors(
  categoryId: number,
  categoriesById: Map<
    number,
    CategoryTreeEntry
  >,
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
      console.warn(
        `[category-mapping] Boucle détectée dans la hiérarchie de la catégorie ${currentId}.`
      );

      break;
    }

    visited.add(currentId);

    const category =
      categoriesById.get(currentId);

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