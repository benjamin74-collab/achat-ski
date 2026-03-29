// src/app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/search";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function toIntOrNull(v: string | null) {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
}

function isBrandActiveUnknown(row: Record<string, unknown>): boolean {
  const b1 = row["active"];
  if (typeof b1 === "boolean") return b1;

  const b2 = row["isActive"];
  if (typeof b2 === "boolean") return b2;

  const b3 = row["enabled"];
  if (typeof b3 === "boolean") return b3;

  const b4 = row["published"];
  if (typeof b4 === "boolean") return b4;

  const s = row["status"];
  if (typeof s === "string") {
    const up = s.toUpperCase();
    if (up === "ACTIVE" || up === "ENABLED" || up === "PUBLISHED") return true;
    if (up === "INACTIVE" || up === "DISABLED" || up === "DRAFT") return false;
  }

  return true;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const category = searchParams.get("category") ?? undefined;
  const inStockOnly = (searchParams.get("stock") ?? "").toLowerCase() === "1";
  const sort = (searchParams.get("sort") as "relevance" | "price_asc" | "price_desc" | null) ?? "relevance";

  const minEur = toIntOrNull(searchParams.get("min"));
  const maxEur = toIntOrNull(searchParams.get("max"));
  const minPriceCents = minEur != null ? minEur * 100 : null;
  const maxPriceCents = maxEur != null ? maxEur * 100 : null;

  const data = await searchProducts({
    q,
    page,
    pageSize: 10,
    category,
    inStockOnly,
    minPriceCents,
    maxPriceCents,
    sort,
  });

  const brandsRaw =
    q.trim().length > 0
      ? await prisma.brand.findMany({
          where: {
            OR: [
              { name: { contains: q.trim(), mode: "insensitive" } },
              { slug: { contains: q.trim(), mode: "insensitive" } },
            ],
          },
          orderBy: [{ name: "asc" }],
          take: 8,
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            active: true,
          },
        })
      : [];

  const brands = brandsRaw
    .filter((b) => isBrandActiveUnknown(b as unknown as Record<string, unknown>))
    .map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      href: `/marques/${b.slug}`,
      kind: "brand" as const,
    }));

  return NextResponse.json(
    {
      ...data,
      brands,
    },
    {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
    },
  );
}