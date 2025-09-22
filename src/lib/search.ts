// src/lib/search.ts
import { prisma } from "@/lib/prisma";

export type ProductSearchItem = {
  id: number;
  slug: string;
  brand: string | null;
  model: string | null;
  season: string | null;
  category: string | null;
  minPriceCents: number | null;
  offerCount: number;
  rank: number;
};

export async function searchProducts(opts: {
  q: string;
  page?: number;
  pageSize?: number;
  category?: string;
  inStockOnly?: boolean;
}) {
  const qs = (opts.q ?? "").trim();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const category = opts.category ?? null;          // string | null
  const inStockOnly = Boolean(opts.inStockOnly);   // boolean

  const rows = await prisma.$queryRaw<ProductSearchItem[]>`
    WITH base AS (
      SELECT
        p.id,
        p.slug,
        p.brand,
        p.model,
        p.season,
        p.category,
        MIN(CASE WHEN o."inStock" THEN o."priceCents" END)::int AS "minPriceCents",
        COUNT(CASE WHEN o."inStock" THEN 1 END)::int          AS "offerCount",
        CASE
          WHEN ${qs}::text = ''::text THEN 0::float4
          ELSE ts_rank(
                 p.fts,
                 websearch_to_tsquery('french', unaccent(${qs}::text))
               )::float4
        END AS rank
      FROM "Product" p
      LEFT JOIN "Sku"   s ON s."productId" = p.id
      LEFT JOIN "Offer" o ON o."skuId"     = s.id
      WHERE
        (
          ${qs}::text = ''::text
          OR p.fts @@ websearch_to_tsquery('french', unaccent(${qs}::text))
        )
        AND (
          COALESCE(${category}::text, ''::text) = ''::text
          OR p."category" = ${category}::text
        )
        AND (
          CASE WHEN ${inStockOnly}::boolean
               THEN o."inStock" = TRUE
               ELSE TRUE
          END
        )
      GROUP BY p.id
    )
    SELECT *
    FROM base
    ORDER BY
      (CASE WHEN ${qs}::text = ''::text THEN 0 ELSE rank END) DESC,
      "minPriceCents" NULLS LAST,
      id ASC
    LIMIT ${pageSize} OFFSET ${offset};
  `;

  // total -> number (pas de BigInt)
  const countRows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count
    FROM "Product" p
    WHERE
      (
        ${qs}::text = ''::text
        OR p.fts @@ websearch_to_tsquery('french', unaccent(${qs}::text))
      )
      AND (
        COALESCE(${category}::text, ''::text) = ''::text
        OR p."category" = ${category}::text
      );
  `;

  const total = countRows[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { items: rows, page, pageSize, total, totalPages, q: qs };
}
