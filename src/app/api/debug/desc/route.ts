// src/app/api/debug/desc/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") ?? "";
  if (!slug) {
    return NextResponse.json({ ok: false, error: "missing slug" }, { status: 400 });
  }

  const p = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, slug: true, description: true },
  });

  return NextResponse.json({
    ok: true,
    slug,
    found: !!p,
    len: p?.description?.length ?? 0,
    preview: p?.description?.slice(0, 120) ?? null,
  });
}
