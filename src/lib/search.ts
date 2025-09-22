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
  rank: number; // score FTS
  prefixScore: number; // 0/1 si préfixe brand/model
  simScore: number; // similarité trigram
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

  const category = opts.category ?? null;        // string | null
  const inStockOnly = Boolean(opts.inStockOnly); // boolean

  // NOTE:
  // - on ajoute 3 types de correspondance:
  //   * FTS: p.fts @@ websearch_to_tsquery('french', unaccent(q))
  //   * PREFIXE: unaccent(brand|model) ILIKE unaccent(q||'%')
  //   * TRIGRAM: brand % q OR model % q (nécessite pg_trgm)
  //
  // - ranking:
  //   1) prefixScore DESC (préfixe exact prioritaire)
  //   2) rank (FTS) DESC
  //   3) simScore DESC (trigram similarity)
  //   4) minPrice ASC

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

        -- Score FTS
        CASE
          WHEN ${qs}::text = ''::text THEN 0::float4
          ELSE ts_rank(
                 p.fts,
                 websearch_to_tsquery('french', unaccent(${qs}::text))
               )::float4
        END AS rank,

        -- Préfixe: 1 si brand OU model commence par q (sans accents)
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
          OR p.fts @@ websearch_to_tsquery('french', unaccent(${qs}::text))
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
    )
    SELECT *
    FROM base
    ORDER BY
      "prefixScore" DESC,
      (CASE WHEN ${qs}::text = ''::text THEN 0 ELSE rank END) DESC,
      "simScore" DESC,
      "minPriceCents" NULLS LAST,
      id ASC
    LIMIT ${pageSize} OFFSET ${offset};
  `;

  // total cohérent avec les mêmes conditions
  const countRows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count
    FROM "Product" p
    WHERE
      (
        ${qs}::text = ''::text
        OR p.fts @@ websearch_to_tsquery('french', unaccent(${qs}::text))
        OR unaccent(coalesce(p.brand,'')) ILIKE unaccent(${qs}::text || '%')
        OR unaccent(coalesce(p.model,'')) ILIKE unaccent(${qs}::text || '%')
        OR p.brand % ${qs}::text
        OR p.model % ${qs}::text
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
