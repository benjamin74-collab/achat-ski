// src/app/b/[brand]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";

export const runtime = "nodejs";
export const revalidate = 120;

type SP = { [k: string]: string | string[] | undefined };
type PageProps = { params: { brand: string }; searchParams: SP };

type BrandItem = {
  id: number;
  slug: string;
  brand: string | null;
  model: string | null;
  season: string | null;
  category: string | null;
  minPriceCents: number | null;
  offerCount: number;
};

function asPositiveInt(v: string | undefined, dflt: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : dflt;
}
function parseIntOrNull(v: string | undefined) {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
}

export async function generateMetadata({ params }: { params: { brand: string } }): Promise<Metadata> {
  const brand = decodeURIComponent(params.brand);
  const title = `Marque ${brand} — produits & meilleurs prix`;
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://achat-ski.vercel.app"}/b/${encodeURIComponent(brand)}`;
  return {
    title,
    description: `Compare les prix des produits ${brand} chez nos marchands partenaires.`,
    alternates: { canonical: url },
    openGraph: { title, url },
  };
}

export default async function BrandPage({ params, searchParams }: PageProps) {
  const brand = decodeURIComponent(params.brand || "").trim();
  if (!brand) return notFound();

  const page = asPositiveInt(searchParams?.page as string, 1);
  const pageSize = 24;
  const offset = (page - 1) * pageSize;

  const category = (searchParams?.category as string) || null; // filtre catégorie optionnel
  const inStockOnly = ((searchParams?.stock as string) ?? "").toLowerCase() === "1";
  const sort = ((searchParams?.sort as string) ??
    "price_asc") as "price_asc" | "price_desc" | "newest";

  // prix (euros) -> cents
  const minEur = parseIntOrNull(searchParams?.min as string | undefined);
  const maxEur = parseIntOrNull(searchParams?.max as string | undefined);
  const minPriceCents = minEur != null ? minEur * 100 : null;
  const maxPriceCents = maxEur != null ? maxEur * 100 : null;

  // 1) lignes paginées
  const items = await prisma.$queryRaw<BrandItem[]>`
    WITH base AS (
      SELECT
        p.id,
        p.slug,
        p.brand,
        p.model,
        p.season,
        p.category,
        MIN(CASE WHEN o."inStock" THEN o."priceCents" END)::int AS "minPriceCents",
        COUNT(CASE WHEN o."inStock" THEN 1 END)::int           AS "offerCount"
      FROM "Product" p
      LEFT JOIN "Sku"   s ON s."productId" = p.id
      LEFT JOIN "Offer" o ON o."skuId"     = s.id
      WHERE
        -- marque exacte, insensible à l'accent/majuscules
        unaccent(coalesce(p.brand,'')) = unaccent(${brand}::text)
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
      CASE WHEN ${sort}::text = 'price_asc'  THEN "minPriceCents" END ASC  NULLS LAST,
      CASE WHEN ${sort}::text = 'price_desc' THEN "minPriceCents" END DESC NULLS LAST,
      CASE WHEN ${sort}::text = 'newest'     THEN id END DESC,
      id ASC
    LIMIT ${pageSize} OFFSET ${offset};
  `;

  // 2) total pour pagination (mêmes filtres)
  const countRows = await prisma.$queryRaw<Array<{ count: number }>>`
    WITH base AS (
      SELECT
        p.id,
        MIN(CASE WHEN o."inStock" THEN o."priceCents" END)::int AS "minPriceCents"
      FROM "Product" p
      LEFT JOIN "Sku"   s ON s."productId" = p.id
      LEFT JOIN "Offer" o ON o."skuId"     = s.id
      WHERE
        unaccent(coalesce(p.brand,'')) = unaccent(${brand}::text)
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

  // Si aucune donnée pour la marque, 404
  if (page === 1 && total === 0) return notFound();

  const hasFilters = Boolean(
    category || inStockOnly || minEur != null || maxEur != null || (sort && sort !== "price_asc")
  );

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Produits {brand}</h1>

      {/* Filtres */}
      <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6" action={`/b/${encodeURIComponent(brand)}`} method="GET">
        <select name="category" defaultValue={category ?? ""} className="rounded-xl border px-3 py-2">
          <option value="">Toutes catégories</option>
          <option value="skis-all-mountain">Skis All-Mountain</option>
          <option value="skis-freeride">Skis Freeride</option>
          <option value="skis-rando">Skis de rando</option>
          <option value="fixations">Fixations</option>
          <option value="chaussures">Chaussures</option>
        </select>

        <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
          <label className="text-sm text-neutral-600">Prix €</label>
          <input
            name="min"
            type="number"
            min={0}
            defaultValue={minEur ?? ""}
            placeholder="min"
            className="w-20 rounded border px-2 py-1 text-sm"
          />
          <span className="text-neutral-400">—</span>
          <input
            name="max"
            type="number"
            min={0}
            defaultValue={maxEur ?? ""}
            placeholder="max"
            className="w-20 rounded border px-2 py-1 text-sm"
          />
        </div>

        <select
          name="sort"
          defaultValue={sort}
          className="rounded-xl border px-3 py-2"
          title="Trier"
        >
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
          <option value="newest">Plus récent</option>
        </select>

        <label className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm">
          <input type="checkbox" name="stock" value="1" defaultChecked={inStockOnly} />
          En stock
        </label>

        <button className="rounded-xl border px-4 py-2 md:col-span-1">Filtrer</button>
      </form>

      {/* Résumé filtres */}
      {hasFilters && (
        <div className="mt-3 text-sm text-neutral-600">
          {category ? <>Catégorie: <b>{category}</b> · </> : null}
          {inStockOnly ? <>En stock · </> : null}
          {minEur != null || maxEur != null ? (
            <>Prix: <b>{minEur ?? 0}</b>—<b>{maxEur ?? "∞"}</b> € · </>
          ) : null}
          {total} produit{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}.
        </div>
      )}

      {/* Résultats */}
      {items.length === 0 ? (
        <p className="mt-6 text-neutral-600">Aucun produit ne correspond aux filtres.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <li key={p.id} className="rounded-2xl border p-4 hover:shadow-sm transition">
              <div className="flex flex-col gap-2">
                <Link href={`/p/${p.slug}`} className="text-lg font-medium hover:underline truncate">
                  {[p.brand, p.model, p.season].filter(Boolean).join(" ")}
                </Link>
                <div className="text-sm text-neutral-600">
                  {p.category ?? "—"} · {p.offerCount} offre{p.offerCount > 1 ? "s" : ""}
                </div>
                <div className="mt-1 text-right">
                  <div className="text-xs text-neutral-500">à partir de</div>
                  <div className="text-lg font-semibold">
                    {p.minPriceCents != null ? money(p.minPriceCents, "EUR") : "—"}
                  </div>
                </div>
                <div className="mt-2">
                  <Link
                    href={`/p/${p.slug}`}
                    className="inline-block rounded-xl border px-3 py-2 text-sm hover:shadow"
                  >
                    Voir le produit
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => {
            const n = i + 1;
            const params = new URLSearchParams();
            if (category) params.set("category", category);
            if (inStockOnly) params.set("stock", "1");
            if (minEur != null) params.set("min", String(minEur));
            if (maxEur != null) params.set("max", String(maxEur));
            if (sort) params.set("sort", sort);
            params.set("page", String(n));
            const href = `/b/${encodeURIComponent(brand)}?${params.toString()}`;
            const isActive = n === page;
            return (
              <Link
                key={n}
                href={href}
                className={`rounded-md px-3 py-1 text-sm ${isActive ? "bg-black text-white" : "border hover:bg-gray-50"}`}
              >
                {n}
              </Link>
            );
          })}
        </nav>
      )}
    </main>
  );
}
