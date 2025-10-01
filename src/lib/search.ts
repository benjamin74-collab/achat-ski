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
  rank: number;        // score FTS
  prefixScore: number; // 0/1 si préfixe brand/model
  simScore: number;    // similarité trigram
};

export async function searchProducts(opts: {
  q: string;
  page?: number;
  pageSize?: number;
  category?: string;
  inStockOnly?: boolean;
  minPriceCents?: number | null;
  maxPriceCents?: number | null;
  sort?: "relevance" | "price_asc" | "price_desc";
}) {
  const qs = (opts.q ?? "").trim();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const category = opts.category ?? null;
  const inStockOnly = Boolean(opts.inStockOnly);
  const minPriceCents = opts.minPriceCents ?? null;
  const maxPriceCents = opts.maxPriceCents ?? null;
  const sort = opts.sort ?? "relevance";

  // On calcule le tsquery UNE FOIS, et seulement si qs != ''.
  // On le réutilise partout via un CROSS JOIN "params".
  const rows = await prisma.$queryRaw<ProductSearchItem[]>`
    WITH params AS (
      SELECT
        ${qs}::text AS qs,
        CASE
          WHEN ${qs}::text <> ''::text
          THEN websearch_to_tsquery('french', unaccent(${qs}::text))
          ELSE NULL::tsquery
        END AS qts
    ),
    base AS (
      SELECT
        p.id,
        p.slug,
        p.brand,
        p.model,
        p.season,
        p.category,
        MIN(CASE WHEN o."inStock" THEN o."priceCents" END)::int AS "minPriceCents",
        COUNT(CASE WHEN o."inStock" THEN 1 END)::int           AS "offerCount",

        -- Score FTS (0 si qs vide)
        CASE
          WHEN (SELECT qs FROM params) = ''::text THEN 0::float4
          ELSE ts_rank(p.fts, (SELECT qts FROM params))::float4
        END AS rank,

        -- Match préfixe (brand/model commence par q)
        GREATEST(
          (unaccent(coalesce(p.brand,'')) ILIKE unaccent((SELECT qs FROM params) || '%'))::int,
          (unaccent(coalesce(p.model,'')) ILIKE unaccent((SELECT qs FROM params) || '%'))::int
        ) AS "prefixScore",

        -- Similarité trigram (on ne l'applique que si qs non vide)
        GREATEST(
          CASE WHEN (SELECT qs FROM params) <> ''::text
               THEN similarity(unaccent(coalesce(p.brand,'')), unaccent((SELECT qs FROM params)))::float4
               ELSE 0::float4 END,
          CASE WHEN (SELECT qs FROM params) <> ''::text
               THEN similarity(unaccent(coalesce(p.model,'')), unaccent((SELECT qs FROM params)))::float4
               ELSE 0::float4 END
        ) AS "simScore"

      FROM "Product" p
      CROSS JOIN params prm
      LEFT JOIN "Sku"   s ON s."productId" = p.id
      LEFT JOIN "Offer" o ON o."skuId"     = s.id
      WHERE
        (
          prm.qs = ''::text
          OR (prm.qts IS NOT NULL AND p.fts @@ prm.qts)
          OR unaccent(coalesce(p.brand,'')) ILIKE unaccent(prm.qs || '%')
          OR unaccent(coalesce(p.model,'')) ILIKE unaccent(prm.qs || '%')
          OR (prm.qs <> ''::text AND p.brand % prm.qs)
          OR (prm.qs <> ''::text AND p.model % prm.qs)
        )
        AND (COALESCE(${category}::text, ''::text) = ''::text OR p."category" = ${category}::text)
        AND (CASE WHEN ${inStockOnly}::boolean THEN o."inStock" = TRUE ELSE TRUE END)
      GROUP BY p.id
      HAVING
        (COALESCE(${minPriceCents}::int, -1) = -1 OR MIN(CASE WHEN o."inStock" THEN o."priceCents" END)::int >= ${minPriceCents}::int)
        AND
        (COALESCE(${maxPriceCents}::int, -1) = -1 OR MIN(CASE WHEN o."inStock" THEN o."priceCents" END)::int <= ${maxPriceCents}::int)
    )
    SELECT *
    FROM base
    ORDER BY
      CASE WHEN ${sort}::text = 'price_asc'  THEN 0
           WHEN ${sort}::text = 'price_desc' THEN 1
           ELSE 2
      END ASC,
      -- 1) tri prix asc
      CASE WHEN ${sort}::text = 'price_asc' THEN "minPriceCents" END ASC NULLS LAST,
      -- 2) tri prix desc
      CASE WHEN ${sort}::text = 'price_desc' THEN "minPriceCents" END DESC NULLS LAST,
      -- 3) tri pertinence (default)
      CASE WHEN ${sort}::text = 'relevance' THEN "prefixScore" END DESC,
      CASE WHEN ${sort}::text = 'relevance' THEN rank END DESC,
      CASE WHEN ${sort}::text = 'relevance' THEN "simScore" END DESC,
      id ASC
    LIMIT ${pageSize} OFFSET ${offset};
  `;

  // Même logique pour le total
  const countRows = await prisma.$queryRaw<Array<{ count: number }>>`
    WITH params AS (
      SELECT
        ${qs}::text AS qs,
        CASE
          WHEN ${qs}::text <> ''::text
          THEN websearch_to_tsquery('french', unaccent(${qs}::text))
          ELSE NULL::tsquery
        END AS qts
    ),
    base AS (
      SELECT
        p.id,
        MIN(CASE WHEN o."inStock" THEN o."priceCents" END)::int AS "minPriceCents"
      FROM "Product" p
      CROSS JOIN params prm
      LEFT JOIN "Sku"   s ON s."productId" = p.id
      LEFT JOIN "Offer" o ON o."skuId"     = s.id
      WHERE
        (
          prm.qs = ''::text
          OR (prm.qts IS NOT NULL AND p.fts @@ prm.qts)
          OR unaccent(coalesce(p.brand,'')) ILIKE unaccent(prm.qs || '%')
          OR unaccent(coalesce(p.model,'')) ILIKE unaccent(prm.qs || '%')
          OR (prm.qs <> ''::text AND p.brand % prm.qs)
          OR (prm.qs <> ''::text AND p.model % prm.qs)
        )
        AND (COALESCE(${category}::text, ''::text) = ''::text OR p."category" = ${category}::text)
        AND (CASE WHEN ${inStockOnly}::boolean THEN o."inStock" = TRUE ELSE TRUE END)
      GROUP BY p.id
      HAVING
        (COALESCE(${minPriceCents}::int, -1) = -1 OR MIN(CASE WHEN o."inStock" THEN o."priceCents" END)::int >= ${minPriceCents}::int)
        AND
        (COALESCE(${maxPriceCents}::int, -1) = -1 OR MIN(CASE WHEN o."inStock" THEN o."priceCents" END)::int <= ${maxPriceCents}::int)
    )
    SELECT COUNT(*)::int AS count FROM base;
  `;

  const total = countRows[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { items: rows, page, pageSize, total, totalPages, q: qs };
}
