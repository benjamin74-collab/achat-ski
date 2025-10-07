// src/app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/search";

export const runtime = "nodejs";

function toIntOrNull(v: string | null) {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
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

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
  });
}
