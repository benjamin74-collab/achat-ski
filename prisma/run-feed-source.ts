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
  type SyncFeedMode,
  type SyncFeedTrigger,
} from "../src/lib/catalog/sync-feed";

type CliOptions = {
  feedSourceId: number;
  trigger: SyncFeedTrigger;
  mode: SyncFeedMode;
};

function parseArgs(
  argv: string[]
): CliOptions {
  const feedSourceId =
    readPositiveInteger(
      readArg(
        argv,
        "--feedSourceId"
      ) ??
        process.env.FEED_SOURCE_ID
    );

  if (!feedSourceId) {
    throw new Error(
      "Paramètre manquant : --feedSourceId=ID"
    );
  }

  const trigger =
    normalizeTrigger(
      readArg(
        argv,
        "--trigger"
      ) ??
        process.env.FEED_TRIGGER ??
        "MANUAL"
    );

  const mode =
    normalizeMode(
      readArg(
        argv,
        "--mode"
      ) ??
        process.env.FEED_SYNC_MODE ??
        "FULL"
    );

  return {
    feedSourceId,
    trigger,
    mode,
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

function normalizeTrigger(
  value: string
): SyncFeedTrigger {
  switch (
    value.trim().toUpperCase()
  ) {
    case "CRON":
      return "CRON";

    case "API":
      return "API";

    case "RETRY":
      return "RETRY";

    case "MANUAL":
      return "MANUAL";

    default:
      throw new Error(
        `Trigger invalide : ${value}. Utilise MANUAL, CRON, API ou RETRY.`
      );
  }
}

function normalizeMode(
  value: string
): SyncFeedMode {
  switch (
    value.trim().toUpperCase()
  ) {
    case "FULL":
      return "FULL";

    case "DELTA":
      return "DELTA";

    default:
      throw new Error(
        `Mode invalide : ${value}. Utilise FULL ou DELTA.`
      );
  }
}

async function main() {
  const options =
    parseArgs(
      process.argv.slice(2)
    );

  console.log("");
  console.log("============================================================");
  console.log("Import catalogue hors Vercel");
  console.log("============================================================");
  console.log(`Feed source ID : ${options.feedSourceId}`);
  console.log(`Trigger        : ${options.trigger}`);
  console.log(`Mode           : ${options.mode}`);
  console.log("============================================================");
  console.log("");

  const result =
    await syncFeedSourceById({
      prisma,
      feedSourceId:
        options.feedSourceId,
      trigger:
        options.trigger,
      mode:
        options.mode,
    });

  console.log("");
  console.log("============================================================");
  console.log("Import terminé");
  console.log("============================================================");
  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );
  console.log("============================================================");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("============================================================");
    console.error("Import échoué");
    console.error("============================================================");
    console.error(error);
    console.error("============================================================");
    console.error("");

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });