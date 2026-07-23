import {
  FeedFormat,
  FeedFrequency,
  MerchantNetwork,
  PrismaClient,
} from "@prisma/client";

const prisma = new PrismaClient();

const SITE_ID =
  process.env.FEED_SITE_ID?.trim() ||
  "meilleur-ski";

const FEED_SOURCE_URL =
  process.env.EKOSPORT_SALOMON_FEED_URL?.trim();

const NETWORK_SLUG = "kwanko";
const MERCHANT_SLUG = "ekosport";
const FEED_SLUG = "ekosport-brands-salomon";

type ColumnMappingSeed = {
  targetField: string;
  sourceColumn: string;
  fallbackColumns: string[];
  required?: boolean;
  defaultValue?: string;
  transform?: string;
  order: number;
};

const COLUMN_MAPPINGS: ColumnMappingSeed[] = [
  {
    targetField: "externalId",
    sourceColumn: "internal reference",
    fallbackColumns: [
      "id",
      "product id",
    ],
    transform: "TEXT",
    order: 10,
  },
  {
    targetField: "parentExternalId",
    sourceColumn: "ID_Parent",
    fallbackColumns: [
      "ID Parent",
      "parent id",
    ],
    transform: "TEXT",
    order: 20,
  },
  {
    targetField: "ean",
    sourceColumn: "EAN or ISBN",
    fallbackColumns: [
      "EAN",
      "universal reference",
    ],
    transform: "EAN",
    order: 30,
  },
  {
    targetField: "manufacturerReference",
    sourceColumn: "manufacturer reference",
    fallbackColumns: [
      "manufacturer_ref",
    ],
    transform: "TEXT",
    order: 40,
  },
  {
    targetField: "title",
    sourceColumn: "name of the product",
    fallbackColumns: [
      "product name",
      "title",
      "nom du produit",
    ],
    required: true,
    transform: "TEXT",
    order: 50,
  },
  {
    targetField: "cleanName",
    sourceColumn: "name",
    fallbackColumns: [
      "clean name",
      "product clean name",
    ],
    transform: "PRODUCT_NAME",
    order: 60,
  },
  {
    targetField: "brand",
    sourceColumn: "brand",
    fallbackColumns: [
      "marque",
    ],
    transform: "BRAND",
    order: 70,
  },
  {
    targetField: "description",
    sourceColumn: "description",
    fallbackColumns: [],
    transform: "HTML",
    order: 80,
  },
  {
    targetField: "categoryPath",
    sourceColumn: "product category",
    fallbackColumns: [
      "category",
    ],
    required: true,
    transform: "TEXT",
    order: 90,
  },
  {
    targetField: "size",
    sourceColumn: "Taille",
    fallbackColumns: [
      "size",
    ],
    transform: "TEXT",
    order: 100,
  },
  {
    targetField: "gender",
    sourceColumn: "Genre",
    fallbackColumns: [
      "gender",
    ],
    transform: "TEXT",
    order: 110,
  },
  {
    targetField: "color",
    sourceColumn: "Color",
    fallbackColumns: [
      "Colour",
      "Couleur",
    ],
    transform: "TEXT",
    order: 120,
  },
  {
    targetField: "price",
    sourceColumn: "current price",
    fallbackColumns: [
      "price",
      "sale price",
    ],
    required: true,
    transform: "NUMBER",
    order: 130,
  },
  {
    targetField: "oldPrice",
    sourceColumn: "crossed price",
    fallbackColumns: [
      "old price",
      "regular price",
    ],
    transform: "NUMBER",
    order: 140,
  },
  {
    targetField: "shippingCost",
    sourceColumn: "shipping costs",
    fallbackColumns: [
      "shipping cost",
    ],
    transform: "NUMBER",
    order: 150,
  },
  {
    targetField: "currency",
    sourceColumn: "currency",
    fallbackColumns: [
      "currency code",
      "devise",
    ],
    defaultValue: "EUR",
    transform: "UPPERCASE",
    order: 160,
  },
  {
    targetField: "availability",
    sourceColumn: "product availability",
    fallbackColumns: [
      "availability",
      "stock indicator",
    ],
    transform: "TEXT",
    order: 170,
  },
  {
    targetField: "inStock",
    sourceColumn: "product availability",
    fallbackColumns: [
      "availability",
      "stock indicator",
    ],
    transform: "AVAILABILITY",
    order: 180,
  },
  {
    targetField: "affiliateUrl",
    sourceColumn: "product page URL",
    fallbackColumns: [
      "product link",
      "affiliate URL",
      "URL",
    ],
    required: true,
    transform: "TEXT",
    order: 190,
  },
  {
    targetField: "merchantProductUrl",
    sourceColumn: "URL",
    fallbackColumns: [
      "merchant URL",
      "merchant product URL",
      "product page URL",
    ],
    transform: "TEXT",
    order: 200,
  },
  {
    targetField: "imageUrl",
    sourceColumn: "big image",
    fallbackColumns: [
      "image link",
      "image URL",
    ],
    transform: "TEXT",
    order: 210,
  },
];

async function main(): Promise<void> {
  if (!FEED_SOURCE_URL) {
    throw new Error(
      [
        "La variable EKOSPORT_SALOMON_FEED_URL est absente.",
        "Ajoute-la dans le fichier .env avant d’exécuter ce script.",
      ].join(" ")
    );
  }

  console.log("");
  console.log("Initialisation du flux universel Ekosport");
  console.log("-----------------------------------------");
  console.log(`Site : ${SITE_ID}`);

  const network =
    await prisma.affiliateNetwork.upsert({
      where: {
        slug: NETWORK_SLUG,
      },
      update: {
        name: "Kwanko",
        websiteUrl: "https://www.kwanko.com",
        active: true,
      },
      create: {
        name: "Kwanko",
        slug: NETWORK_SLUG,
        websiteUrl: "https://www.kwanko.com",
        active: true,
      },
    });

  console.log(
    `Réseau : ${network.name} (#${network.id})`
  );

  const merchant =
    await prisma.merchant.upsert({
      where: {
        slug: MERCHANT_SLUG,
      },
      update: {
        name: "Ekosport",
        platform: MerchantNetwork.KWANKO,
        network: "kwanko",
        websiteUrl: "https://www.ekosport.fr",
        active: true,
        status: "active",
      },
      create: {
        name: "Ekosport",
        slug: MERCHANT_SLUG,
        platform: MerchantNetwork.KWANKO,
        network: "kwanko",
        websiteUrl: "https://www.ekosport.fr",
        active: true,
        status: "active",
      },
    });

  console.log(
    `Marchand : ${merchant.name} (#${merchant.id})`
  );

  const affiliateProgram =
    await prisma.affiliateProgram.upsert({
      where: {
        siteId_merchantId_networkId: {
          siteId: SITE_ID,
          merchantId: merchant.id,
          networkId: network.id,
        },
      },
      update: {
        name: "Programme Ekosport - Kwanko",
        active: true,
      },
      create: {
        siteId: SITE_ID,
        merchantId: merchant.id,
        networkId: network.id,
        name: "Programme Ekosport - Kwanko",
        active: true,
      },
    });

  console.log(
    `Programme : #${affiliateProgram.id}`
  );

  const feedSource =
    await prisma.feedSource.upsert({
      where: {
        siteId_slug: {
          siteId: SITE_ID,
          slug: FEED_SLUG,
        },
      },
      update: {
        affiliateProgramId:
          affiliateProgram.id,

        name:
          "Ekosport - Marques Salomon",

        sourceUrl: FEED_SOURCE_URL,

        format: FeedFormat.CSV,
        delimiter: ";",
        encoding: "utf-8",

        active: true,
        autoImport: true,

        frequency: FeedFrequency.DAILY,
        timezone: "Europe/Paris",

        lastErrorMessage: null,
      },
      create: {
        siteId: SITE_ID,

        affiliateProgramId:
          affiliateProgram.id,

        name:
          "Ekosport - Marques Salomon",

        slug: FEED_SLUG,
        sourceUrl: FEED_SOURCE_URL,

        format: FeedFormat.CSV,
        delimiter: ";",
        encoding: "utf-8",

        active: true,
        autoImport: true,

        frequency: FeedFrequency.DAILY,
        timezone: "Europe/Paris",
      },
    });

  console.log(
    `Flux : ${feedSource.name} (#${feedSource.id})`
  );

  await seedColumnMappings(
    feedSource.id
  );

  const categoryResult =
    await migrateCategoryMappings(
      feedSource.id
    );

  console.log("");
  console.log("Configuration terminée");
  console.log("----------------------");
  console.log(
    `Mappings de colonnes : ${COLUMN_MAPPINGS.length}`
  );
  console.log(
    `Catégories examinées : ${categoryResult.categories}`
  );
  console.log(
    `Mappings de catégories : ${categoryResult.mappings}`
  );
  console.log(
    `Mappings ignorés car vides : ${categoryResult.skipped}`
  );
  console.log("");
  console.log(
    "Le script est idempotent : il peut être relancé sans créer de doublons."
  );
}

async function seedColumnMappings(
  feedSourceId: number
): Promise<void> {
  for (const mapping of COLUMN_MAPPINGS) {
    await prisma.feedColumnMapping.upsert({
      where: {
        feedSourceId_targetField: {
          feedSourceId,
          targetField:
            mapping.targetField,
        },
      },
      update: {
        sourceColumn:
          mapping.sourceColumn,

        fallbackColumns:
          mapping.fallbackColumns,

        required:
          mapping.required ?? false,

        defaultValue:
          mapping.defaultValue ?? null,

        transform:
          mapping.transform ?? null,

        order: mapping.order,
      },
      create: {
        feedSourceId,

        targetField:
          mapping.targetField,

        sourceColumn:
          mapping.sourceColumn,

        fallbackColumns:
          mapping.fallbackColumns,

        required:
          mapping.required ?? false,

        defaultValue:
          mapping.defaultValue ?? null,

        transform:
          mapping.transform ?? null,

        order: mapping.order,
      },
    });
  }
}

async function migrateCategoryMappings(
  feedSourceId: number
): Promise<{
  categories: number;
  mappings: number;
  skipped: number;
}> {
  const categories =
    await prisma.category.findMany({
      where: {
        mapEkosport: {
          isEmpty: false,
        },
      },
      select: {
        id: true,
        name: true,
        mapEkosport: true,
      },
      orderBy: {
        id: "asc",
      },
    });

  let mappings = 0;
  let skipped = 0;

  for (const category of categories) {
    const uniquePaths = new Map<
      string,
      string
    >();

    for (
      const externalPath of
      category.mapEkosport
    ) {
      const cleanExternalPath =
        externalPath.trim();

      const normalizedExternalPath =
        normalizeCategoryPath(
          cleanExternalPath
        );

      if (
        !cleanExternalPath ||
        !normalizedExternalPath
      ) {
        skipped += 1;
        continue;
      }

      if (
        !uniquePaths.has(
          normalizedExternalPath
        )
      ) {
        uniquePaths.set(
          normalizedExternalPath,
          cleanExternalPath
        );
      }
    }

    for (
      const [
        normalizedExternalPath,
        externalPath,
      ] of uniquePaths
    ) {
      await prisma.categoryExternalMapping.upsert({
        where: {
          feedSourceId_normalizedExternalPath_categoryId:
            {
              feedSourceId,
              normalizedExternalPath,
              categoryId: category.id,
            },
        },
        update: {
          externalPath,
          priority: 0,
          active: true,
        },
        create: {
          feedSourceId,
          categoryId: category.id,

          externalPath,
          normalizedExternalPath,

          priority: 0,
          active: true,
        },
      });

      mappings += 1;
    }

    console.log(
      `Catégorie : ${category.name} — ${uniquePaths.size} mapping(s)`
    );
  }

  return {
    categories: categories.length,
    mappings,
    skipped,
  };
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

function normalizeText(
  value: string | null | undefined
): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "Échec de l’initialisation Ekosport :"
    );
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });