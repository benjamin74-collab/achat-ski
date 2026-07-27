import type {
  PrismaClient,
} from "@prisma/client";

import type {
  MerchantPlatform,
} from "./feed-types";

import type {
  FeedTargetField,
  FeedColumnTransform,
  GenericFeedNormalizerConfig,
  RuntimeColumnMapping,
} from "./generic-normalizer";

const SUPPORTED_TARGET_FIELDS =
  new Set<FeedTargetField>([
    "externalId",
    "parentExternalId",
    "gtin",
    "manufacturerReference",
    "title",
    "cleanName",
    "brand",
    "description",
    "categoryPath",
    "size",
    "color",
    "gender",
    "price",
    "oldPrice",
    "shippingCost",
    "currency",
    "availability",
    "inStock",
    "affiliateUrl",
    "merchantProductUrl",
    "imageUrl",
  ]);

const SUPPORTED_TRANSFORMS =
  new Set<FeedColumnTransform>([
    "NONE",
    "TRIM",
    "TEXT",
    "UPPERCASE",
    "LOWERCASE",
    "NUMBER",
    "EAN",
    "BRAND",
    "PRODUCT_NAME",
    "HTML",
    "BOOLEAN",
    "AVAILABILITY",
  ]);

export type FeedRuntime = {
  feedSourceId: number;

  siteId: string;

  name: string;
  slug: string;

  sourceUrl: string;

  format: "CSV" | "TSV" | "XML" | "JSON";
  delimiter: string;
  encoding: string;

  active: boolean;
  autoImport: boolean;

  frequency:
    | "MANUAL_ONLY"
    | "EVERY_6_HOURS"
    | "EVERY_12_HOURS"
    | "DAILY"
    | "WEEKLY";

  timezone: string;

  affiliateProgramId: number;

  merchant: {
    id: number;
    name: string;
    slug: string;
    platform: MerchantPlatform;
  };

  affiliateNetwork: {
    id: number;
    name: string;
    slug: string;
  };

  normalizerConfig:
    GenericFeedNormalizerConfig;
};

export async function loadFeedRuntime(
  prisma: PrismaClient,
  feedSourceId: number
): Promise<FeedRuntime> {
  const feedSource =
    await prisma.feedSource.findUnique({
      where: {
        id: feedSourceId,
      },
      include: {
        affiliateProgram: {
          include: {
            merchant: true,
            network: true,
          },
        },

        columnMappings: {
          orderBy: [
            {
              order: "asc",
            },
            {
              id: "asc",
            },
          ],
        },
      },
    });

  if (!feedSource) {
    throw new Error(
      `Le flux ${feedSourceId} n'existe pas.`
    );
  }

  if (!feedSource.active) {
    throw new Error(
      `Le flux "${feedSource.name}" est désactivé.`
    );
  }

  if (
    !feedSource.affiliateProgram.active
  ) {
    throw new Error(
      `Le programme d'affiliation associé au flux "${feedSource.name}" est désactivé.`
    );
  }

  if (
    !feedSource.affiliateProgram.network
      .active
  ) {
    throw new Error(
      `La plateforme d'affiliation associée au flux "${feedSource.name}" est désactivée.`
    );
  }

  if (
    !feedSource.affiliateProgram.merchant
      .active
  ) {
    throw new Error(
      `Le marchand associé au flux "${feedSource.name}" est désactivé.`
    );
  }

  const merchantPlatform =
    normalizeMerchantPlatform(
      feedSource.affiliateProgram.merchant
        .platform
    );


console.log(
  "[feed-runtime:v3]",
  {
    feedSourceId,
    mappings:
      feedSource.columnMappings.map(
        (mapping) => ({
          id: mapping.id,
          targetField:
            mapping.targetField,
        })
      ),
  }
);


  const mappings: RuntimeColumnMapping[] =
    feedSource.columnMappings.map(
      (mapping) => {
        const targetField =
          normalizeTargetField(
            mapping.targetField
          );

        const transform =
          normalizeTransform(
            mapping.transform
          );

        return {
          targetField,

          sourceColumns: uniqueStrings([
            mapping.sourceColumn,
            ...mapping.fallbackColumns,
          ]),

          fallbackValue:
            mapping.defaultValue,

          transform,
          required: mapping.required,
          active: true,
        };
      }
    ); 

  const normalizerConfig:
    GenericFeedNormalizerConfig = {
    mappings,

    merchantSlug:
      feedSource.affiliateProgram.merchant
        .slug,

    merchantPlatform,

    defaultCurrency: "EUR",
  };

  return {
    feedSourceId: feedSource.id,

    siteId: feedSource.siteId,

    name: feedSource.name,
    slug: feedSource.slug,

    sourceUrl: feedSource.sourceUrl,

    format: feedSource.format,
    delimiter:
      feedSource.format === "TSV"
        ? "\t"
        : feedSource.delimiter,

    encoding: feedSource.encoding,

    active: feedSource.active,
    autoImport: feedSource.autoImport,

    frequency: feedSource.frequency,
    timezone: feedSource.timezone,

    affiliateProgramId:
      feedSource.affiliateProgramId,

    merchant: {
      id:
        feedSource.affiliateProgram
          .merchant.id,

      name:
        feedSource.affiliateProgram
          .merchant.name,

      slug:
        feedSource.affiliateProgram
          .merchant.slug,

      platform: merchantPlatform,
    },

    affiliateNetwork: {
      id:
        feedSource.affiliateProgram
          .network.id,

      name:
        feedSource.affiliateProgram
          .network.name,

      slug:
        feedSource.affiliateProgram
          .network.slug,
    },

    normalizerConfig,
  };
}

function normalizeTargetField(
  value: string
): FeedTargetField {
  const cleaned = value
    .replace(/^\uFEFF/, "")
    .replace(/[\u200B-\u200D\u2060]/g, "")
    .replace(/\u00A0/g, " ")
    .trim()
    .replace(/^["']|["']$/g, "");

  const aliases: Record<
    string,
    FeedTargetField
  > = {
    externalid: "externalId",
    parentexternalid: "parentExternalId",
    gtin: "gtin",
    ean: "gtin",
    manufacturerreference:
      "manufacturerReference",
    title: "title",
    cleanname: "cleanName",
    brand: "brand",
    description: "description",
    categorypath: "categoryPath",
    size: "size",
    color: "color",
    gender: "gender",
    price: "price",
    oldprice: "oldPrice",
    shippingcost: "shippingCost",
    currency: "currency",
    availability: "availability",
    instock: "inStock",
    affiliateurl: "affiliateUrl",
    merchantproducturl:
      "merchantProductUrl",
    imageurl: "imageUrl",
  };

  const lookupKey = cleaned
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  const normalized =
    aliases[lookupKey];

  if (
    !normalized ||
    !SUPPORTED_TARGET_FIELDS.has(normalized)
  ) {
    const characterCodes = Array.from(
      cleaned
    ).map((character) =>
      `${character}:${character.codePointAt(0)}`
    );

    throw new Error(
      [
        `Champ cible non pris en charge : ${JSON.stringify(value)}.`,
        `Valeur nettoyée : ${JSON.stringify(cleaned)}.`,
        `Clé normalisée : ${JSON.stringify(lookupKey)}.`,
        `Caractères : ${characterCodes.join(", ")}.`,
      ].join(" ")
    );
  }

  return normalized;
}

function normalizeTransform(
  value: string | null
): FeedColumnTransform | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const normalized =
    value.trim().toUpperCase();

  if (
    !SUPPORTED_TRANSFORMS.has(
      normalized as FeedColumnTransform
    )
  ) {
    throw new Error(
      `Transformation non prise en charge : "${value}".`
    );
  }

  return normalized as FeedColumnTransform;
}

function normalizeMerchantPlatform(
  value: string
): MerchantPlatform {
  switch (value.toUpperCase()) {
    case "KWANKO":
      return "KWANKO";

    case "AWIN":
      return "AWIN";

    case "AFFILAE":
      return "AFFILAE";

    case "DIRECT":
      return "DIRECT";

    default:
      return "OTHER";
  }
}

function uniqueStrings(
  values: Array<
    string | null | undefined
  >
): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter(
          (value): value is string =>
            Boolean(value)
        )
    )
  );
}