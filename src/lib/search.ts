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
};

export async function searchProducts(opts: {
  q: string;
  page?: number;
  pageSize?: number;
  category?: string;           // optionnel: filtre catégorie
  inStockOnly?: boolean;       // optionnel: true => offres en stock uniquement
}) {
  const q = (opts.q ?? "").trim();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  // tsquery côté SQL (plainto_tsquery) + fallback si pas de FTS column
  // NB: on génère aussi un COUNT(*) total pour la pagination.
  // IMPORTANT: on laisse Postgres paramétrer les valeurs (pas d'unsafe).
  const rows = await prisma.$queryRaw<ProductSearchItem[]>`
    WITH qry AS (
      SELECT
        p.id,
        p.slug,
        p.brand,
        p.model,
        p.season,
        p.category,
        MIN(CASE WHEN o."inStock" = TRUE THEN o."priceCents" END) AS "minPriceCents",
        COUNT(CASE WHEN o."inStock" = TRUE THEN 1 END) AS "offerCount",
        CASE
          WHEN ${q} = '' THEN 0
          ELSE ts_rank(
            COALESCE(p.fts, to_tsvector('simple',
              COALESCE(p.brand,'') || ' ' || COALESCE(p.model,'') || ' ' || COALESCE(p.season,'') || ' ' || COALESCE(p.category,'')
            )),
            plainto_tsquery('simple', ${q})
          )
        END AS rank
      FROM "Product" p
      LEFT JOIN "Sku" s ON s."productId" = p.id
      LEFT JOIN "Offer" o ON o."skuId" = s.id
      WHERE
        (
          ${q} = ''
          OR COALESCE(p.fts, to_tsvector('simple',
                COALESCE(p.brand,'') || ' ' || COALESCE(p.model,'') || ' ' || COALESCE(p.season,'') || ' ' || COALESCE(p.category,'')
             )) @@ plainto_tsquery('simple', ${q})
        )
        AND (${opts.category ?? null} IS NULL OR p."category" = ${opts.category ?? null})
        AND (${opts.inStockOnly ?? false} = FALSE OR o."inStock" = TRUE)
      GROUP BY p.id
    )
    SELECT * FROM qry
    ORDER BY
      (CASE WHEN ${q} = '' THEN 0 ELSE rank END) DESC,
      "minPriceCents" NULLS LAST,
      id ASC
    LIMIT ${pageSize} OFFSET ${offset};
  `;

  const [{ count }] = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Product" p
    WHERE
      (${q} = '')
      OR COALESCE(p.fts, to_tsvector('simple',
           COALESCE(p.brand,'') || ' ' || COALESCE(p.model,'') || ' ' || COALESCE(p.season,'') || ' ' || COALESCE(p.category,'')
         )) @@ plainto_tsquery('simple', ${q})
      AND (${opts.category ?? null} IS NULL OR p."category" = ${opts.category ?? null});
  `;

  const total = Number(count);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { items: rows, page, pageSize, total, totalPages, q };
}
