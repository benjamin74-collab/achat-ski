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

  // On calcule le vecteur FTS à la volée pour éviter d'avoir besoin de la colonne p.fts
  // tsvector = to_tsvector('french', unaccent(brand || ' ' || model || ' ' || season))
  // tsquery  = websearch_to_tsquery('french', unaccent(qs)) si qs non vide
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
        COUNT(CASE WHEN o."inStock" THEN 1 END)::int           AS "offerCount",

        -- tsquery calculée seulement si qs non vide
        CASE
          WHEN ${qs}::text = ''::text THEN 0::float4
          ELSE ts_rank(
                 to_tsvector('french', unaccent(
                   coalesce(p.brand,'') || ' ' || coalesce(p.model,'') || ' ' || coalesce(p.season,'')
                 )),
                 websearch_to_tsquery('french', unaccent(${qs}::text))
               )::float4
        END AS rank,

        -- Match préfixe (brand/model commence par q)
        GREATEST(
          (unaccent(coalesce(p.brand,'')) ILIKE unaccent(${qs}::text || '%'))::int,
          (unaccent(coalesce(p.model,'')) ILIKE unaccent(${qs}::text || '%'))::int
        ) AS "prefixScore",

        -- Similarité trigram (tolérance fautes)
        GREATEST(
          similarity(unaccent(coalesce(p.brand,'')), unaccent(${qs}::text))::float4,
          similarity(unaccent(coalesce(p.model,'')), unaccent(${qs}::text))::float4
        ) AS "simScore"

      FROM "Product" p
      LEFT JOIN "Sku"   s ON s."productId" = p.id
      LEFT JOIN "Offer" o ON o."skuId"     = s.id
      WHERE
        (
          ${qs}::text = ''::text
          OR to_tsvector('french', unaccent(
               coalesce(p.brand,'') || ' ' || coalesce(p.model,'') || ' ' || coalesce(p.season,'')
             ))
             @@ websearch_to_tsquery('french', unaccent(${qs}::text))
          OR unaccent(coalesce(p.brand,'')) ILIKE unaccent(${qs}::text || '%')
          OR unaccent(coalesce(p.model,'')) ILIKE unaccent(${qs}::text || '%')
          OR p.brand % ${qs}::text
          OR p.model % ${qs}::text
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
      CASE WHEN ${sort}::text = 'price_asc' THEN "minPriceCents" END ASC NULLS LAST,
      CASE WHEN ${sort}::text = 'price_desc' THEN "minPriceCents" END DESC NULLS LAST,
      CASE WHEN ${sort}::text = 'relevance' THEN "prefixScore" END DESC,
      CASE WHEN ${sort}::text = 'relevance' THEN rank END DESC,
      CASE WHEN ${sort}::text = 'relevance' THEN "simScore" END DESC,
      id ASC
    LIMIT ${pageSize} OFFSET ${offset};
  `;

  const countRows = await prisma.$queryRaw<Array<{ count: number }>>`
    WITH base AS (
      SELECT
        p.id,
        MIN(CASE WHEN o."inStock" THEN o."priceCents" END)::int AS "minPriceCents"
      FROM "Product" p
      LEFT JOIN "Sku"   s ON s."productId" = p.id
      LEFT JOIN "Offer" o ON o."skuId"     = s.id
      WHERE
        (
          ${qs}::text = ''::text
          OR to_tsvector('french', unaccent(
               coalesce(p.brand,'') || ' ' || coalesce(p.model,'') || ' ' || coalesce(p.season,'')
             ))
             @@ websearch_to_tsquery('french', unaccent(${qs}::text))
          OR unaccent(coalesce(p.brand,'')) ILIKE unaccent(${qs}::text || '%')
          OR unaccent(coalesce(p.model,'')) ILIKE unaccent(${qs}::text || '%')
          OR p.brand % ${qs}::text
          OR p.model % ${qs}::text
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
