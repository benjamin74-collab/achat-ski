import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  prisma,
} from "@/lib/prisma";

import {
  syncFeedSourceById,
} from "@/lib/catalog/sync-feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 900;

const MAX_FEEDS_PER_RUN = 1;

export async function GET(
  req: NextRequest
) {
	const expectedSecret =
	  process.env.CRON_SECRET?.trim();

	const authorization =
	  req.headers.get("authorization")?.trim();

  if (
    !expectedSecret ||
    authorization !==
      `Bearer ${expectedSecret}`
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const requestedFeedSourceId =
      parsePositiveInteger(
        req.nextUrl.searchParams.get(
          "feedSourceId"
        )
      );

    const requestedSlug =
      req.nextUrl.searchParams
        .get("slug")
        ?.trim();

    const requestedSiteId =
      req.nextUrl.searchParams
        .get("siteId")
        ?.trim();

    const feedSources =
      requestedFeedSourceId
        ? await prisma.feedSource.findMany({
            where: {
              id: requestedFeedSourceId,
              active: true,
            },

            select: {
              id: true,
              siteId: true,
              slug: true,
              name: true,
            },

            take: 1,
          })
        : requestedSlug
          ? await prisma.feedSource.findMany({
              where: {
                slug: requestedSlug,
                active: true,

                ...(requestedSiteId
                  ? {
                      siteId:
                        requestedSiteId,
                    }
                  : {}),
              },

              select: {
                id: true,
                siteId: true,
                slug: true,
                name: true,
              },

              take:
                MAX_FEEDS_PER_RUN,
            })
          : await prisma.feedSource.findMany({
              where: {
                active: true,
                autoImport: true,

                OR: [
                  {
                    nextRunAt: null,
                  },
                  {
                    nextRunAt: {
                      lte: new Date(),
                    },
                  },
                ],
              },

              select: {
                id: true,
                siteId: true,
                slug: true,
                name: true,
              },

              orderBy: [
                {
                  nextRunAt: "asc",
                },
                {
                  id: "asc",
                },
              ],

              take:
                MAX_FEEDS_PER_RUN,
            });

    if (feedSources.length === 0) {
      return NextResponse.json({
        ok: true,

        message:
          "Aucun flux à importer.",

        processed: 0,
        results: [],
      });
    }

    const results: Array<{
      feedSourceId: number;
      siteId: string;
      slug: string;
      name: string;
      ok: boolean;
      result?: unknown;
      error?: string;
    }> = [];

    for (const feedSource of feedSources) {
      try {
        const result =
          await syncFeedSourceById({
            prisma,

            feedSourceId:
              feedSource.id,

            trigger: "CRON",
          });

        results.push({
          feedSourceId:
            feedSource.id,

          siteId:
            feedSource.siteId,

          slug:
            feedSource.slug,

          name:
            feedSource.name,

          ok: true,
          result,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : String(error);

        console.error(
          `[cron/catalog-sync] ${feedSource.siteId}/${feedSource.slug}`,
          error
        );

        results.push({
          feedSourceId:
            feedSource.id,

          siteId:
            feedSource.siteId,

          slug:
            feedSource.slug,

          name:
            feedSource.name,

          ok: false,
          error: errorMessage,
        });
      }
    }

    const failed =
      results.filter(
        (result) => !result.ok
      ).length;

    return NextResponse.json({
      ok: failed === 0,

      processed:
        results.length,

      succeeded:
        results.length - failed,

      failed,

      results,
    });
  } catch (error) {
    console.error(
      "[cron/catalog-sync]",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}

function parsePositiveInteger(
  value: string | null
): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed =
    Number.parseInt(value, 10);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return undefined;
  }

  return parsed;
}