// src/app/api/suggest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const q = (u.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ suggestions: [] });

  // utilise trigram + unaccent + français pour de bonnes correspondances
  const rows = await prisma.$queryRaw<Array<{ slug: string; brand: string | null; model: string | null }>>`
    SELECT slug, brand, model
    FROM "Product"
    WHERE
      unaccent(coalesce(brand,'')) ILIKE unaccent(${q + '%'})
      OR unaccent(coalesce(model,'')) ILIKE unaccent(${q + '%'})
      OR brand % ${q}       -- trigram (tolérance fautes)
      OR model % ${q}
    ORDER BY
      CASE
        WHEN unaccent(coalesce(brand,'')) ILIKE unaccent(${q + '%'}) THEN 0
        WHEN unaccent(coalesce(model,'')) ILIKE unaccent(${q + '%'}) THEN 1
        ELSE 2
      END,
      slug
    LIMIT 10;
  `;

  return NextResponse.json({
    suggestions: rows.map((r) => ({
      label: [r.brand, r.model].filter(Boolean).join(" "),
      href: `/p/${r.slug}`,
    })),
  });
}
