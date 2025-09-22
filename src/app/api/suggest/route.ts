import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Renvoie jusqu'à 10 suggestions {label, href}
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ suggestions: [] }, { headers: { "Cache-Control": "public, max-age=30" } });

  // trigram + unaccent pour tolérer petites fautes et accents
  const rows = await prisma.$queryRaw<Array<{ slug: string; brand: string | null; model: string | null }>>`
    SELECT slug, brand, model
    FROM "Product"
    WHERE
      unaccent(coalesce(brand,'')) ILIKE unaccent(${q + '%'}) OR
      unaccent(coalesce(model,'')) ILIKE unaccent(${q + '%'}) OR
      brand % ${q} OR
      model % ${q}
    ORDER BY
      CASE
        WHEN unaccent(coalesce(brand,'')) ILIKE unaccent(${q + '%'}) THEN 0
        WHEN unaccent(coalesce(model,'')) ILIKE unaccent(${q + '%'}) THEN 1
        ELSE 2
      END,
      slug
    LIMIT 10;
  `;

  const suggestions = rows.map(r => ({
    label: [r.brand, r.model].filter(Boolean).join(" "),
    href: `/p/${r.slug}`,
  }));

  // Petit cache CDN côté Vercel pour réduire la charge
  return NextResponse.json({ suggestions }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
