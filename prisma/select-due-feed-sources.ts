
import { loadEnvConfig } from "@next/env";
import { appendFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";

loadEnvConfig(process.cwd());

type SelectedFeed = {
  id: number;
  mode: "FULL" | "DELTA";
  trigger: "MANUAL" | "CRON";
};

function positiveInteger(
  value: string | undefined,
  fallback?: number
): number {
  if (!value?.trim()) {
    if (fallback !== undefined) return fallback;
    throw new Error("Identifiant ou limite manquant.");
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new Error(`Entier positif invalide : ${value}`);
  }

  return number;
}

async function main(): Promise<void> {
  const isManual =
    process.env.EVENT_NAME === "workflow_dispatch";

  const selectedId =
    process.env.INPUT_FEED_SOURCE_ID?.trim();

  let feeds: SelectedFeed[];

  if (isManual && selectedId) {
    const id = positiveInteger(selectedId);

    const requestedMode =
      (process.env.INPUT_MODE ?? "delta")
        .trim()
        .toLowerCase();

    if (
      requestedMode !== "delta" &&
      requestedMode !== "full"
    ) {
      throw new Error(
        `Mode invalide : ${requestedMode}`
      );
    }

    const feed = await prisma.feedSource.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        siteId: true,
        active: true,
        affiliateProgram: {
          select: {
            active: true,
            merchant: {
              select: {
                name: true,
                active: true,
                allowProductCreation: true,
              },
            },
          },
        },
      },
    });

    if (!feed) {
      throw new Error(`Flux ${id} introuvable.`);
    }

    const merchant =
      feed.affiliateProgram.merchant;

    if (
      !feed.active ||
      !feed.affiliateProgram.active ||
      !merchant.active
    ) {
      throw new Error(
        `Flux ${id} désactivé ou programme/marchand inactif.`
      );
    }

    if (
      requestedMode === "full" &&
      !merchant.allowProductCreation
    ) {
      throw new Error(
        `FULL interdit pour "${merchant.name}" ` +
        `sur le site "${feed.siteId}". ` +
        `Ce marchand n'est pas autorisé à créer des produits.`
      );
    }

    feeds = [{
      id,
      mode: requestedMode === "full"
        ? "FULL"
        : "DELTA",
      trigger: "MANUAL",
    }];

    console.log(
      `Import manuel : ${feed.name} — ` +
      `${requestedMode.toUpperCase()}`
    );
  } else {
    const maxFeeds = isManual
      ? positiveInteger(
          process.env.INPUT_MAX_FEEDS,
          20
        )
      : 20;

    const now = new Date();

    const dueFeeds =
      await prisma.feedSource.findMany({
        where: {
          active: true,
          autoImport: true,
          frequency: { not: "MANUAL_ONLY" },
          OR: [
            { nextRunAt: null },
            { nextRunAt: { lte: now } },
          ],
        },
        orderBy: [
          { nextRunAt: "asc" },
          { id: "asc" },
        ],
        take: maxFeeds,
        select: {
          id: true,
          name: true,
          nextRunAt: true,
        },
      });

    for (const feed of dueFeeds) {
      console.log(
        `Flux dû : ${feed.id} — ${feed.name} — ` +
        (feed.nextRunAt?.toISOString() ?? "sans date")
      );
    }

    feeds = dueFeeds.map((feed) => ({
      id: feed.id,
      mode: "DELTA",
      trigger: "CRON",
    }));
  }

  console.log(
    `Nombre de flux sélectionnés : ${feeds.length}`
  );

  const outputPath = process.env.GITHUB_OUTPUT;

  if (!outputPath) {
    throw new Error(
      "GITHUB_OUTPUT absent : ce script doit être lancé dans GitHub Actions."
    );
  }

  appendFileSync(
    outputPath,
    `feeds=${JSON.stringify(feeds)}\ncount=${feeds.length}\n`
  );
}

main()
  .catch((error) => {
    console.error(
      "Échec de sélection des flux :",
      error
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
