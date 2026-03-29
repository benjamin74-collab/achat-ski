import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type ProductSuggestionRow = {
  slug: string;
  brand: string | null;
  model: string | null;
};

type BrandSuggestionRow = {
  slug: string;
  name: string;
  active: boolean | null;
};

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

// Renvoie jusqu'à 10 suggestions {label, href, kind}
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json(
      { suggestions: [] },
      { headers: { "Cache-Control": "public, max-age=30" } },
    );
  }

  // Produits
  const productRows = await prisma.$queryRaw<ProductSuggestionRow[]>`
    SELECT slug, brand, model
    FROM "Product"
    WHERE
      unaccent(coalesce(brand,'')) ILIKE unaccent(${q + "%"}) OR
      unaccent(coalesce(model,'')) ILIKE unaccent(${q + "%"}) OR
      brand % ${q} OR
      model % ${q}
    ORDER BY
      CASE
        WHEN unaccent(coalesce(brand,'')) ILIKE unaccent(${q + "%"}) THEN 0
        WHEN unaccent(coalesce(model,'')) ILIKE unaccent(${q + "%"}) THEN 1
        ELSE 2
      END,
      slug
    LIMIT 8;
  `;

  // Marques
  const brandRows = await prisma.brand.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ name: "asc" }],
    take: 5,
    select: {
      slug: true,
      name: true,
      active: true,
    },
  });

  const brandSuggestions = brandRows
    .filter((b) => isBrandActiveUnknown(b as unknown as Record<string, unknown>))
    .map((b) => ({
      label: b.name,
      href: `/marques/${b.slug}`,
      kind: "brand" as const,
    }));

  const productSuggestions = productRows.map((r) => ({
    label: [r.brand, r.model].filter(Boolean).join(" "),
    href: `/p/${r.slug}`,
    kind: "product" as const,
  }));

  // Dédupe simple par href en gardant l'ordre : marques d'abord, puis produits
  const seen = new Set<string>();
  const suggestions = [...brandSuggestions, ...productSuggestions].filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  }).slice(0, 10);

  return NextResponse.json(
    { suggestions },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}