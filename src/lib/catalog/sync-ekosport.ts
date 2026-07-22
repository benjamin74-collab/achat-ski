import type {
  PrismaClient,
} from "@prisma/client";

import type {
  FeedImportResult,
} from "./feed-types";

import {
  loadFeedRuntime,
} from "./feed-runtime";

import {
  syncFeedContent,
} from "./sync-feed";

type SyncEkosportOptions = {
  prisma: PrismaClient;
  content: string;
  feedKey: string;
  sourceUrl?: string;
  filename?: string;
};

export async function syncEkosportCsv({
  prisma,
  content,
  feedKey,
  sourceUrl,
  filename,
}: SyncEkosportOptions): Promise<FeedImportResult> {
  const feedSource =
    await prisma.feedSource.findFirst({
      where: {
        active: true,

        affiliateProgram: {
          merchant: {
            slug: "ekosport",
          },
        },

        OR: [
          {
            slug: feedKey,
          },

          ...(sourceUrl
            ? [
                {
                  sourceUrl,
                },
              ]
            : []),
        ],
      },

      select: {
        id: true,
      },
    });

  if (!feedSource) {
    throw new Error(
      [
        "Aucun FeedSource Ekosport actif n'a été trouvé.",
        `Clé recherchée : "${feedKey}".`,
        "Crée d'abord le flux et ses FeedColumnMapping dans la base.",
      ].join(" ")
    );
  }

  const runtime =
    await loadFeedRuntime(
      prisma,
      feedSource.id
    );

  return syncFeedContent({
    prisma,
    runtime,
    content,

    trigger: "API",

    sourceUrl:
      sourceUrl ??
      runtime.sourceUrl,

    filename:
      filename ??
      `${runtime.slug}.csv`,
  });
}