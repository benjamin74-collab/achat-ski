import {
  loadEnvConfig,
} from "@next/env";

loadEnvConfig(
  process.cwd()
);

import {
  prisma,
} from "../src/lib/prisma";

import {
  syncFeedSourceById,
} from "../src/lib/catalog/sync-feed";

type CliOptions = {
  maxFeeds: number;
  siteId?: string;
};

function parseArgs(
  argv: string[]
): CliOptions {
  const maxFeeds =
    readPositiveInteger(
      readArg(
        argv,
        "--maxFeeds"
      ) ??
        process.env.CATALOG_SYNC_MAX_FEEDS
    ) ?? 1;

  const siteId =
    readArg(
      argv,
      "--siteId"
    ) ??
    process.env.CATALOG_SYNC_SITE_ID;

  return {
    maxFeeds,
    siteId:
      siteId?.trim() ||
      undefined,
  };
}

function readArg(
  argv: string[],
  name: string
): string | undefined {
  const prefix =
    `${name}=`;

  const value =
    argv.find((arg) =>
      arg.startsWith(prefix)
    );

  return value
    ?.slice(prefix.length)
    .trim();
}

function readPositiveInteger(
  value: string | undefined
): number | null {
  if (!value) {
    return null;
  }

  const parsed =
    Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return null;
  }

  return parsed;
}

async function main() {
  const options =
    parseArgs(
      process.argv.slice(2)
    );

  const now =
    new Date();

  console.log("");
  console.log("============================================================");
  console.log("Cron catalogue GitHub Actions");
  console.log("============================================================");
  console.log(`Mode           : DELTA uniquement`);
  console.log(`Max feeds      : ${options.maxFeeds}`);
  console.log(`Site           : ${options.siteId ?? "tous"}`);
  console.log(`Date           : ${now.toISOString()}`);
  console.log("============================================================");
  console.log("");

  const dueFeeds =
    await prisma.feedSource.findMany({
      where: {
        active:
          true,

        autoImport:
          true,

        frequency: {
          not:
            "MANUAL_ONLY",
        },

        ...(options.siteId
          ? {
              siteId:
                options.siteId,
            }
          : {}),

        OR: [
          {
            nextRunAt:
              null,
          },
          {
            nextRunAt: {
              lte:
                now,
            },
          },
        ],
      },

      orderBy: [
        {
          nextRunAt:
            "asc",
        },
        {
          id:
            "asc",
        },
      ],

      take:
        options.maxFeeds,

      select: {
        id:
          true,

        siteId:
          true,

        name:
          true,

        slug:
          true,

        frequency:
          true,

        nextRunAt:
          true,
      },
    });

  if (
    dueFeeds.length === 0
  ) {
    console.log(
      "Aucun flux à synchroniser pour le moment."
    );
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (
    const feed of dueFeeds
  ) {
    console.log("");
    console.log("------------------------------------------------------------");
    console.log(`Flux ID        : ${feed.id}`);
    console.log(`Nom            : ${feed.name}`);
    console.log(`Slug           : ${feed.slug}`);
    console.log(`Site           : ${feed.siteId}`);
    console.log(`Fréquence      : ${feed.frequency}`);
    console.log(
      `Next run       : ${feed.nextRunAt?.toISOString() ?? "immédiat"}`
    );
    console.log("------------------------------------------------------------");
    console.log("");

    try {
      const result =
        await syncFeedSourceById({
          prisma,

          feedSourceId:
            feed.id,

          trigger:
            "CRON",

          mode:
            "DELTA",
        });

      successCount += 1;

      console.log("");
      console.log("Résultat :");
      console.log(
        JSON.stringify(
          result,
          null,
          2
        )
      );
    } catch (error) {
      errorCount += 1;

      console.error("");
      console.error(
        `Erreur pendant le flux ${feed.id} - ${feed.name}`
      );
      console.error(error);
    }
  }

  console.log("");
  console.log("============================================================");
  console.log("Cron terminé");
  console.log("============================================================");
  console.log(`Flux OK        : ${successCount}`);
  console.log(`Flux en erreur : ${errorCount}`);
  console.log("============================================================");
  console.log("");

  if (
    errorCount > 0
  ) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error("============================================================");
    console.error("Cron catalogue échoué");
    console.error("============================================================");
    console.error(error);
    console.error("============================================================");
    console.error("");

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });