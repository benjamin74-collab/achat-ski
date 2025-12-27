// src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/search";

export const runtime = "nodejs";

<<<<<<< HEAD
export async function GET(req: Request) {
=======
function toIntOrNull(v: string | null) {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
}

export async function GET(req: NextRequest) {
>>>>>>> feat/brand-ui
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const category = searchParams.get("category") ?? undefined;
  const inStockOnly = (searchParams.get("stock") ?? "").toLowerCase() === "1";
<<<<<<< HEAD
  const sortParam = (searchParams.get("sort") ?? "relevance") as
    | "relevance"
    | "price_asc"
    | "price_desc";

  const toCents = (v: string | null) =>
    v ? Math.max(0, Math.floor(Number(v))) * 100 : null;
=======
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
>>>>>>> feat/brand-ui

  const minPriceCents = toCents(searchParams.get("min"));
  const maxPriceCents = toCents(searchParams.get("max"));

  try {
    const data = await searchProducts({
      q,
      page,
      pageSize: 24,
      category,
      inStockOnly,
      minPriceCents,
      maxPriceCents,
      sort: sortParam,
    });

    // JSON safe BigInt
    return new NextResponse(
      JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? Number(v) : v)),
      { headers: { "content-type": "application/json; charset=utf-8" }, status: 200 }
    );
  } catch (err) {
    console.error("GET /api/search failed:", err);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}
