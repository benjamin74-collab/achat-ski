// src/app/search/page.tsx
import Link from "next/link";
import { searchProducts } from "@/lib/search";
import { money } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // évite des pré-renders fragiles

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

  const minPriceEuros = parseIntOrNull(searchParams?.min as string | undefined);
  const maxPriceEuros = parseIntOrNull(searchParams?.max as string | undefined);
  const minPriceCents = minPriceEuros != null ? minPriceEuros * 100 : null;
  const maxPriceCents = maxPriceEuros != null ? maxPriceEuros * 100 : null;

  let data:
    | Awaited<ReturnType<typeof searchProducts>>
    | { items: any[]; page: number; pageSize: number; total: number; totalPages: number; q: string } = {
    items: [],
    page,
    pageSize: 24,
    total: 0,
    totalPages: 1,
    q,
  };

  try {
    data = await searchProducts({
      q,
      page,
      pageSize: 24,
      category,
      inStockOnly,
      minPriceCents,
      maxPriceCents,
      sort: sort ?? "relevance",
    });
  } catch (e) {
    console.error("SSR /search failed:", e);
    // On garde la page en vie avec zéro résultat plutôt qu’une 500
  }

  const hasFilters = Boolean(q || category || inStockOnly || minPriceEuros != null || maxPriceEuros != null);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Résultats {q ? <>pour “{q}”</> : null}</h1>

      {/* Formulaire /search */}
      <form action="/search" method="GET" className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
        <input name="q" defaultValue={q} placeholder="Rechercher…" className="md:col-span-2 rounded-xl border px-4 py-2" />
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
          <input name="min" type="number" min={0} defaultValue={minPriceEuros ?? ""} placeholder="min" className="w-20 rounded border px-2 py-1 text-sm" />
          <span className="text-neutral-400">—</span>
          <input name="max" type="number" min={0} defaultValue={maxPriceEuros ?? ""} placeholder="max" className="w-20 rounded border px-2 py-1 text-sm" />
        </div>
        <select name="sort" defaultValue={sort ?? "relevance"} className="rounded-xl border px-3 py-2" title="Trier">
          <option value="relevance">Pertinence</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
        </select>
        <label className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm">
          <input type="checkbox" name="stock" value="1" defaultChecked={inStockOnly} />
          En stock
        </label>
        <button className="rounded-xl border px-4 py-2 md:col-span-1">Filtrer</button>
      </form>

      {hasFilters && (
        <div className="mt-3 text-sm text-neutral-600">
          {category ? <>Catégorie: <b>{category}</b> · </> : null}
          {inStockOnly ? <>En stock · </> : null}
          {minPriceEuros != null || maxPriceEuros != null ? (
            <>Prix: <b>{minPriceEuros ?? 0}</b>—<b>{maxPriceEuros ?? "∞"}</b> € · </>
          ) : null}
          {data.total} produit{data.total > 1 ? "s" : ""} trouvé{data.total > 1 ? "s" : ""}.
        </div>
      )}

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
                  <div className="text-lg font-semibold">
                    {p.minPriceCents != null ? money(p.minPriceCents, "EUR") : "—"}
                  </div>
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
              <Link key={n} href={href} className={`rounded-md px-3 py-1 text-sm ${isActive ? "bg-black text-white" : "border hover:bg-gray-50"}`}>
                {n}
              </Link>
            );
          })}
        </nav>
      )}
    </main>
  );
}
