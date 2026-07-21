import type { PrismaClient } from "@prisma/client";
import type { MappedCategory } from "./feed-types";
import { normalizeText } from "./normalize";

type CategoryMappingEntry = MappedCategory & {
  normalizedMapping: string;
};

export async function loadEkosportCategoryMappings(
  prisma: PrismaClient
): Promise<CategoryMappingEntry[]> {
  const categories = await prisma.category.findMany({
    where: {
      published: true,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      mapEkosport: true,
    },
  });

  return categories
    .flatMap((category) =>
      category.mapEkosport
        .map(normalizeCategoryPath)
        .filter(Boolean)
        .map((normalizedMapping) => ({
          id: category.id,
          slug: category.slug,
          name: category.name,
          normalizedMapping,
        }))
    )
    .sort(
      (a, b) =>
        b.normalizedMapping.length - a.normalizedMapping.length
    );
}

export function resolveEkosportCategory(
  categoryPath: string | null | undefined,
  mappings: CategoryMappingEntry[]
): MappedCategory | null {
  const normalizedPath = normalizeCategoryPath(categoryPath);
  if (!normalizedPath) return null;

  const match = mappings.find(({ normalizedMapping }) =>
    categoryMatches(normalizedPath, normalizedMapping)
  );

  if (!match) return null;

  return {
    id: match.id,
    slug: match.slug,
    name: match.name,
  };
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
    normalizedPath.startsWith(`${normalizedMapping} > `)
  );
}
