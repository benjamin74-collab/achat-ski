// src/app/search/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { searchProducts } from "@/lib/search";
import { money } from "@/lib/format";
import PriceRange from "@/components/search/PriceRange";
import CategorySelect, { type CategoryItem } from "@/components/search/CategorySelect";

export const runtime = "nodejs";

type SP = { [key: string]: string | string[] | undefined };

function parseIntOrNull(v: string | undefined) {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
}

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const q = (searchParams?.q as string) ?? "";
  const page = Number((searchParams?.page as string) ?? "1") || 1;
  const category = (searchParams?.category as string) || undefined;
  const inStockOnly = ((searchParams?.stock as string) ?? "").toLowerCase() === "1";
  const sort = (searchParams?.sort as string) as "relevance" | "price_asc" | "price_desc" | undefined;

  // prix saisis en euros -> convertir en cents
  const minPriceEuros = parseIntOrNull(searchParams?.min as string | undefined);
  const maxPriceEuros = parseIntOrNull(searchParams?.max as string | undefined);
  const minPriceCents = minPriceEuros != null ? minPriceEuros * 100 : null;
  const maxPriceCents = maxPriceEuros != null ? maxPriceEuros * 100 : null;

  // ✅ Catégories dynamiques (depuis la table backoffice)
  const cats = await prisma.category.findMany({
	where: { active: true },
    select: { id: true, slug: true, name: true, parentId: true },
    orderBy: [{ name: "asc" }],
  });

  // ✅ build tree -> liste hiérarchisée sans "any" (parents, enfants, petites-filles…)
  type CatRow = {
    id: unknown;
    slug: string;
    name: string;
    parentId: unknown | null;
  };

  const rows = cats as CatRow[];

  // Map parentKey -> children[]
  const byParent = new Map<string, CatRow[]>();
  for (const c of rows) {
    const key = c.parentId == null ? "" : String(c.parentId);
    const arr = byParent.get(key) ?? [];
    arr.push(c);
    byParent.set(key, arr);
  }

  // tri sécurité (FR)
  for (const arr of byParent.values()) {
    arr.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }

  function walk(parentKey: string, level: number, out: CategoryItem[]) {
    const list = byParent.get(parentKey) ?? [];
    for (const c of list) {
      out.push({ slug: c.slug, name: c.name, level });
      walk(String(c.id), level + 1, out);
    }
  }

  const categoryItems: CategoryItem[] = [];
  walk("", 0, categoryItems);

  // ✅ Bornes prix “safe” (robustes)
  const minBoundEuros = 0;
  const maxBoundEuros = 3000;

  const data = await searchProducts({
    q,
    page,
    pageSize: 24,
    category,
    inStockOnly,
    minPriceCents,
    maxPriceCents,
    sort: sort ?? "relevance",
  });

  const hasFilters = Boolean(q || category || inStockOnly || minPriceEuros != null || maxPriceEuros != null);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Résultats {q ? <>pour “{q}”</> : null}</h1>

      {/* Filtres */}
      <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12" action="/search" method="GET">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher…"
          className="md:col-span-6 rounded-xl border px-4 py-2"
        />

        <div className="md:col-span-3">
          <CategorySelect items={categoryItems} defaultValue={category ?? ""} />
        </div>

        <select
          name="sort"
          defaultValue={sort ?? "relevance"}
          className="md:col-span-3 rounded-xl border px-3 py-2"
          title="Trier"
        >
          <option value="relevance">Pertinence</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
        </select>

        {/* Prix : double curseur + inputs */}
        <div className="md:col-span-8">
          <PriceRange minBound={minBoundEuros} maxBound={maxBoundEuros} initialMin={minPriceEuros} initialMax={maxPriceEuros} />
        </div>

        <label className="md:col-span-2 flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm">
          <input type="checkbox" name="stock" value="1" defaultChecked={inStockOnly} />
          En stock
        </label>

        <button className="md:col-span-2 rounded-xl px-4 py-2 font-medium text-white bg-neutral-900 hover:bg-neutral-800 transition focus:outline-none focus:ring-2 focus:ring-neutral-400">Filtrer</button>
      </form>

      {/* Résumé filtres */}
      {hasFilters && (
        <div className="mt-3 text-sm text-neutral-600">
          {category ? (
            <>
              Catégorie: <b>{category}</b> ·{" "}
            </>
          ) : null}
          {inStockOnly ? <>En stock · </> : null}
          {minPriceEuros != null || maxPriceEuros != null ? (
            <>
              Prix: <b>{minPriceEuros ?? minBoundEuros}</b>—<b>{maxPriceEuros ?? maxBoundEuros}</b> € ·{" "}
            </>
          ) : null}
          {data.total} produit{data.total > 1 ? "s" : ""} trouvé{data.total > 1 ? "s" : ""}.
        </div>
      )}

      {/* Résultats en grille */}
      {data.items.length === 0 ? (
        <p className="mt-6 text-neutral-600">Aucun produit ne correspond aux filtres.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((p) => (
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
                  <div className="text-lg font-semibold">{p.minPriceCents != null ? money(p.minPriceCents, "EUR") : "—"}</div>
                </div>
                <div className="mt-2">
                  <Link href={`/p/${p.slug}`} className="inline-block rounded-xl border px-3 py-2 text-sm hover:shadow">
                    Voir le produit
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: data.totalPages }).map((_, i) => {
            const n = i + 1;
            const params = new URLSearchParams();
            if (q.trim()) params.set("q", q.trim());
            if (category) params.set("category", category);
            if (inStockOnly) params.set("stock", "1");
            if (minPriceEuros != null) params.set("min", String(minPriceEuros));
            if (maxPriceEuros != null) params.set("max", String(maxPriceEuros));
            if (sort) params.set("sort", sort);
            params.set("page", String(n));
            const href = `/search?${params.toString()}`;
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