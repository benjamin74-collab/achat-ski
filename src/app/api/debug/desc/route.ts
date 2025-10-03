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

  // Pas de `select` ici → on évite les divergences de types Prisma entre envs
  const p = await prisma.product.findUnique({ where: { slug } });

  // Lecture "safe" de la description si elle existe dans le modèle/DB
  const desc =
    p && typeof p === "object" && p !== null && "description" in p
      ? ((p as any).description as string | null | undefined) ?? null
      : null;

  return NextResponse.json({
    ok: true,
    slug,
    found: !!p,
    hasDescription: !!(desc && desc.trim()),
    len: desc?.length ?? 0,
    preview: desc ? desc.slice(0, 120) : null,
  });
}
