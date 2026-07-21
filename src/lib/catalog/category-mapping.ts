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
  normalizedMapping: string;
};

export type EkosportCategoryMappings = {
  mappings: CategoryMappingEntry[];
  categoriesById: Map<number, CategoryTreeEntry>;
};

export async function loadEkosportCategoryMappings(
  prisma: PrismaClient
): Promise<EkosportCategoryMappings> {
  /*
   * On charge toutes les catégories publiées, y compris celles
   * qui n'ont aucun mapEkosport.
   *
   * Elles sont nécessaires pour pouvoir remonter automatiquement
   * toute la hiérarchie des catégories parentes.
   */
  const categories = await prisma.category.findMany({
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

  /*
   * Seules les catégories possédant au moins une valeur
   * mapEkosport participent à la correspondance directe
   * avec les chemins du flux.
   */
  const mappings = categories
    .flatMap((category) =>
      category.mapEkosport
        .map(normalizeCategoryPath)
        .filter(Boolean)
        .map((normalizedMapping) => ({
          id: category.id,
          slug: category.slug,
          name: category.name,
          parentId: category.parentId,
          normalizedMapping,
        }))
    )
    .sort(
      (a, b) =>
        b.normalizedMapping.length -
        a.normalizedMapping.length
    );

  return {
    mappings,
    categoriesById,
  };
}

/**
 * Résout un chemin de catégorie Ekosport.
 *
 * La catégorie explicitement mappée la plus précise devient
 * la catégorie principale.
 *
 * Toutes ses catégories parentes sont ensuite automatiquement
 * ajoutées dans la liste des catégories associées au produit.
 */
export function resolveEkosportCategories(
  categoryPath: string | null | undefined,
  source: EkosportCategoryMappings
): CategoryResolution | null {
  const normalizedPath =
    normalizeCategoryPath(categoryPath);

  if (!normalizedPath) {
    return null;
  }

  const matchingEntries = source.mappings.filter(
    ({ normalizedMapping }) =>
      categoryMatches(
        normalizedPath,
        normalizedMapping
      )
  );

  if (matchingEntries.length === 0) {
    return null;
  }

  /*
   * Les mappings sont triés par longueur décroissante.
   * La première correspondance est donc normalement
   * la catégorie la plus précise.
   */
  const mostPreciseMatch = matchingEntries[0];

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

  /*
   * On ajoute toutes les catégories correspondant explicitement
   * au chemin Ekosport.
   */
  for (const match of matchingEntries) {
    resolvedCategories.set(match.id, {
      id: match.id,
      slug: match.slug,
      name: match.name,
    });
  }

  /*
   * Pour chaque catégorie explicitement trouvée, on remonte
   * automatiquement tous ses parents.
   */
  for (const match of matchingEntries) {
    addCategoryAndAncestors(
      match.id,
      source.categoriesById,
      resolvedCategories
    );
  }

  /*
   * On force la catégorie principale en première position.
   */
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
 * Alias temporaire permettant de conserver la compatibilité
 * avec un éventuel ancien import utilisant encore une seule
 * catégorie.
 */
export function resolveEkosportCategory(
  categoryPath: string | null | undefined,
  source: EkosportCategoryMappings
): MappedCategory | null {
  return (
    resolveEkosportCategories(
      categoryPath,
      source
    )?.primaryCategory ?? null
  );
}

export function normalizeCategoryPath(
  value: string | null | undefined
): string {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\s*(>|\/|\||»|→)\s*/g, " > ")
    .replace(/\s+/g, " ")
    .trim();
}

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
 * Ajoute une catégorie ainsi que tous ses parents.
 *
 * Une protection empêche une éventuelle boucle dans la hiérarchie
 * si des parentId incorrects sont enregistrés en base.
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

  let currentId: number | null = categoryId;

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