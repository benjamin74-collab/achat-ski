// src/app/api/consent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CONSENT_VERSION } from "@/lib/consent";
import { getSiteConfig } from "@/config/site";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { choice?: "essential" | "all" };
    const choice = body.choice === "all" ? "ALL" : "ESSENTIAL";

    const site = getSiteConfig();
    const url = new URL(req.url);

    await prisma.cookieConsentLog.create({
      data: {
        siteId: site.id,
        choice,
        version: CONSENT_VERSION,
        userAgent: req.headers.get("user-agent") ?? undefined,
        path: url.searchParams.get("path") ?? undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}