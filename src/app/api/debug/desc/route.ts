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

  // Pas de select → on évite les divergences de types Prisma entre envs
  const p = await prisma.product.findUnique({ where: { slug } });

  // Lecture typée sans `any`
  type MaybeDesc = { description?: string | null };
  const desc =
    p && typeof p === "object" && p !== null && "description" in (p as Record<string, unknown>)
      ? ((p as MaybeDesc).description ?? null)
      : null;

  return NextResponse.json({
    ok: true,
    slug,
    found: Boolean(p),
    hasDescription: Boolean(desc && desc.trim()),
    len: desc?.length ?? 0,
    preview: desc ? desc.slice(0, 120) : null,
  });
}
