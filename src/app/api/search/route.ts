import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/search";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const category = searchParams.get("category") ?? undefined;
  const inStockOnly = (searchParams.get("stock") ?? "").toLowerCase() === "1";

  const data = await searchProducts({ q, page, pageSize: 10, category, inStockOnly });
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
  });
}
