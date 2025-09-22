import { prisma } from "@/lib/prisma";

export async function searchProducts({
  q,
  page = 1,
  pageSize = 20,
  category,
  inStockOnly = false,
}: {
  q: string;
  page?: number;
  pageSize?: number;
  category?: string;
  inStockOnly?: boolean;
}) {
  const qs = (q ?? "").trim();
  const offset = (Math.max(1, page) - 1) * pageSize;

  // On passe la requête au dico 'french' + unaccent
  const rows = await prisma.$queryRaw<
    Array<{
      id: number;
      slug: string;
      brand: string | null;
      model: string | null;
      season: string | null;
      category: string | null;
      minPriceCents: number | null;
      offerCount: number;
      rank: number;
    }>
  >`
    WITH base AS (
      SELECT
        p.id, p.slug, p.brand, p.model, p.season, p.category,
        MIN(CASE WHEN o."inStock" THEN o."priceCents" END) AS "minPriceCents",
        COUNT(CASE WHEN o."inStock" THEN 1 END) AS "offerCount",
        CASE
          WHEN ${qs} = '' THEN 0
          ELSE ts_rank(p.fts, websearch_to_tsquery('french', unaccent(${qs})))
        END AS rank
      FROM "Product" p
      LEFT JOIN "Sku" s ON s."productId" = p.id
      LEFT JOIN "Offer" o ON o."skuId" = s.id
      WHERE
        (
          ${qs} = ''
          OR p.fts @@ websearch_to_tsquery('french', unaccent(${qs}))
        )
        AND (${category ?? null} IS NULL OR p."category" = ${category ?? null})
        AND (${inStockOnly} = FALSE OR o."inStock" = TRUE)
      GROUP BY p.id
    )
    SELECT * FROM base
    ORDER BY (CASE WHEN ${qs} = '' THEN 0 ELSE rank END) DESC, "minPriceCents" NULLS LAST, id ASC
    LIMIT ${pageSize} OFFSET ${offset};
  `;

  const [{ count }] = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Product" p
    WHERE
      (${qs} = '')
      OR p.fts @@ websearch_to_tsquery('french', unaccent(${qs}))
      AND (${category ?? null} IS NULL OR p."category" = ${category ?? null});
  `;

  const total = Number(count);
  return {
    items: rows,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    q: qs,
  };
}
