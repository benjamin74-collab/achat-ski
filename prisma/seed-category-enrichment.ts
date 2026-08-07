import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const prisma = new PrismaClient();

type RuleInput = {
  name: string;
  siteId?: string;
  feedSourceSlug?: string | null;
  sourceCategorySlug?: string | null;
  targetCategorySlug: string;
  includeTerms: string[];
  excludeTerms?: string[];
  matchMode?: "ANY" | "ALL";
  searchTitle?: boolean;
  searchDescription?: boolean;
  searchCategoryPath?: boolean;
  searchBrand?: boolean;
  makePrimary?: boolean;
  priority?: number;
  active?: boolean;
};

type LibraryFile = {
  version?: number;
  siteId?: string;
  library?: string;
  rules: RuleInput[];
};

async function main() {
  const source = process.argv[2];

  if (!source) {
    throw new Error(
      [
        "Fichier JSON manquant.",
        "Exemple :",
        "npm run seed:category-enrichment -- prisma/seed-data/category-enrichment-rules-skis-alpins.json",
      ].join("\n")
    );
  }

  const filePath = resolve(process.cwd(), source);
  const payload = JSON.parse(
    readFileSync(filePath, "utf-8")
  ) as LibraryFile;

  if (!Array.isArray(payload.rules)) {
    throw new Error(
      `Le fichier ${basename(filePath)} ne contient pas de tableau "rules".`
    );
  }

  const defaultSiteId =
    payload.siteId?.trim() || "meilleur-ski";

  const categorySlugs = Array.from(
    new Set(
      payload.rules.flatMap((rule) => [
        rule.sourceCategorySlug,
        rule.targetCategorySlug,
      ]).filter((value): value is string => Boolean(value))
    )
  );

  const feedSourceSlugs = Array.from(
    new Set(
      payload.rules
        .map((rule) => rule.feedSourceSlug)
        .filter((value): value is string => Boolean(value))
    )
  );

  const [categories, feedSources] = await Promise.all([
    prisma.category.findMany({
      where: {
        slug: {
          in: categorySlugs,
        },
      },
      select: {
        id: true,
        slug: true,
        published: true,
      },
    }),

    feedSourceSlugs.length > 0
      ? prisma.feedSource.findMany({
          where: {
            slug: {
              in: feedSourceSlugs,
            },
          },
          select: {
            id: true,
            slug: true,
            siteId: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const categoryBySlug = new Map(
    categories.map((category) => [
      category.slug,
      category,
    ])
  );

  const feedSourceByKey = new Map(
    feedSources.map((feedSource) => [
      `${feedSource.siteId}:${feedSource.slug}`,
      feedSource,
    ])
  );

  const missingCategories = categorySlugs.filter(
    (slug) => !categoryBySlug.has(slug)
  );

  if (missingCategories.length > 0) {
    throw new Error(
      [
        "Catégories introuvables :",
        ...missingCategories.map((slug) => `- ${slug}`),
      ].join("\n")
    );
  }

  let created = 0;
  let updated = 0;

  for (const rule of payload.rules) {
    const siteId =
      rule.siteId?.trim() || defaultSiteId;

    const sourceCategory = rule.sourceCategorySlug
      ? categoryBySlug.get(rule.sourceCategorySlug)
      : undefined;

    const targetCategory =
      categoryBySlug.get(rule.targetCategorySlug);

    if (!targetCategory) {
      throw new Error(
        `Catégorie cible introuvable : ${rule.targetCategorySlug}`
      );
    }

    if (!targetCategory.published) {
      throw new Error(
        `La catégorie cible "${rule.targetCategorySlug}" n'est pas publiée.`
      );
    }

    const feedSource = rule.feedSourceSlug
      ? feedSourceByKey.get(
          `${siteId}:${rule.feedSourceSlug}`
        )
      : undefined;

    if (rule.feedSourceSlug && !feedSource) {
      throw new Error(
        `Flux introuvable pour ${siteId} : ${rule.feedSourceSlug}`
      );
    }

    const existing =
      await prisma.categoryEnrichmentRule.findFirst({
        where: {
          siteId,
          name: rule.name,
        },
        select: {
          id: true,
        },
      });

    const data = {
      siteId,
      name: rule.name,

      feedSourceId:
        feedSource?.id ?? null,

      sourceCategoryId:
        sourceCategory?.id ?? null,

      targetCategoryId:
        targetCategory.id,

      includeTerms:
        uniqueStrings(rule.includeTerms),

      excludeTerms:
        uniqueStrings(rule.excludeTerms ?? []),

      matchMode:
        rule.matchMode ?? "ANY",

      searchTitle:
        rule.searchTitle ?? true,

      searchDescription:
        rule.searchDescription ?? false,

      searchCategoryPath:
        rule.searchCategoryPath ?? false,

      searchBrand:
        rule.searchBrand ?? false,

      makePrimary:
        rule.makePrimary ?? true,

      priority:
        rule.priority ?? 0,

      active:
        rule.active ?? true,
    };

    if (existing) {
      await prisma.categoryEnrichmentRule.update({
        where: {
          id: existing.id,
        },
        data,
      });

      updated += 1;
    } else {
      await prisma.categoryEnrichmentRule.create({
        data,
      });

      created += 1;
    }
  }

  console.log(
    [
      `Bibliothèque : ${payload.library ?? basename(filePath)}`,
      `Site par défaut : ${defaultSiteId}`,
      `Règles lues : ${payload.rules.length}`,
      `Règles créées : ${created}`,
      `Règles mises à jour : ${updated}`,
    ].join("\n")
  );
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

main()
  .catch((error) => {
    console.error(
      "Erreur pendant l'import des règles d'enrichissement."
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
