import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { syncEkosportCsv } from "@/lib/catalog/sync-ekosport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const authorization =
    req.headers.get("authorization");

  if (
    !expectedSecret ||
    authorization !== `Bearer ${expectedSecret}`
  ) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const sourceUrl =
    process.env.EKOSPORT_SALOMON_FEED_URL;

  if (!sourceUrl) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "EKOSPORT_SALOMON_FEED_URL manquante",
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(sourceUrl, {
      cache: "no-store",
      headers: {
        "user-agent":
          "Meilleur-Ski Catalog Sync/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Téléchargement du flux impossible : ${response.status} ${response.statusText}`
      );
    }

    const content = await response.text();

    const result = await syncEkosportCsv({
      prisma,
      content,
      feedKey: "ekosport-brands-salomon",
      sourceUrl,
      filename: "ekosport-brands-salomon.csv",
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error("[cron/catalog-sync]", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
