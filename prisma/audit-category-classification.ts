import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const siteId =
    process.argv[2] ?? "meilleur-ski";

  const categories =
    await prisma.category.findMany({
      where: {
        published: true,
      },
      orderBy: [
        {
          order: "asc",
        },
        {
          name: "asc",
        },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        published: true,
      },
    });

  const feedSources =
    await prisma.feedSource.findMany({
      where: {
        siteId,
        active: true,
      },
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,

        affiliateProgram: {
          select: {
            merchant: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },

        categoryMappings: {
          where: {
            active: true,
          },
          orderBy: [
            {
              priority: "desc",
            },
            {
              externalPath: "asc",
            },
          ],
          select: {
            id: true,
            externalPath: true,
            normalizedExternalPath: true,
            priority: true,

            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                parentId: true,
              },
            },
          },
        },
      },
    });

  const enrichmentRules =
    await prisma.categoryEnrichmentRule.findMany({
      where: {
        siteId,
        active: true,
      },
      orderBy: [
        {
          priority: "desc",
        },
        {
          id: "asc",
        },
      ],
      select: {
        id: true,
        name: true,
        active: true,
        priority: true,
        makePrimary: true,
        matchMode: true,

        includeTerms: true,
        excludeTerms: true,

        searchTitle: true,
        searchDescription: true,
        searchCategoryPath: true,
        searchBrand: true,

        feedSource: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },

        sourceCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
          },
        },

        targetCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
          },
        },
      },
    });

  const result = {
    generatedAt:
      new Date().toISOString(),

    siteId,

    categories,

    feedSources:
      feedSources.map((feed) => ({
        id: feed.id,
        name: feed.name,
        slug: feed.slug,

        merchant:
          feed.affiliateProgram.merchant,

        categoryMappings:
          feed.categoryMappings,
      })),

    enrichmentRules,
  };

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(
      "Erreur pendant l’audit des catégories."
    );

    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });