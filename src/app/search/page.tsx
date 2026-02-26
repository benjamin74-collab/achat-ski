// src/app/search/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { searchProducts } from "@/lib/search";
import { money } from "@/lib/format";
import CategorySelect, { type CategoryItem } from "@/components/search/CategorySelect";
import PriceRangeInline from "@/components/search/PriceRangeInline";
import SortSelect from "@/components/search/SortSelect";

export const runtime = "nodejs";

type SP = { [key: string]: string | string[] | undefined };

function parseIntOrNull(v: string | undefined) {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
}

type Sort = "relevance" | "price_asc" | "price_desc";

function isCategoryActiveUnknown(row: Record<string, unknown>): boolean {
  // champs fréquents
  const b1 = row["active"];
  if (typeof b1 === "boolean") return b1;

  const b2 = row["isActive"];
  if (typeof b2 === "boolean") return b2;

  const b3 = row["enabled"];
  if (typeof b3 === "boolean") return b3;

  const b4 = row["published"];
  if (typeof b4 === "boolean") return b4;

  // status enum/string : ACTIVE / INACTIVE / PUBLISHED / DRAFT ...
  const s = row["status"];
  if (typeof s === "string") {
    const up = s.toUpperCase();
    if (up === "ACTIVE" || up === "ENABLED" || up === "PUBLISHED") return true;
    if (up === "INACTIVE" || up === "DISABLED" || up === "DRAFT") return false;
  }

  // Si on ne trouve rien : on ne filtre pas (safe)
  return true;
}

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const q = (searchParams?.q as string) ?? "";
  const page = Number((searchParams?.page as string) ?? "1") || 1;
  const category = (searchParams?.category as string) || undefined;

  // tri (hors filtres)
  const sort = ((searchParams?.sort as string) || "relevance") as Sort;

  // prix saisis en euros -> convertir en cents
  const minPriceEuros = parseIntOrNull(searchParams?.min as string | undefined);
  const maxPriceEuros = parseIntOrNull(searchParams?.max as string | undefined);
  const minPriceCents = minPriceEuros != null ? minPriceEuros * 100 : null;
  const maxPriceCents = maxPriceEuros != null ? maxPriceEuros * 100 : null;

  // ✅ Catégories dynamiques (on récupère tous les champs pour pouvoir filtrer "actif" si le champ existe)
  const catsRaw = await prisma.category.findMany({
    orderBy: [{ name: "asc" }],
  });

  // filtrage actif "robuste"
  const cats = catsRaw.filter((c) => isCategoryActiveUnknown(c as unknown as Record<string, unknown>));

  // build tree -> liste hiérarchisée (parents, enfants, petites-filles…)
  type CatRow = { id: unknown; slug: string; name: string; parentId: unknown | null };

  const rows = cats as unknown as CatRow[];
  const byParent = new Map<string, CatRow[]>();
  for (const c of rows) {
    const key = c.parentId == null ? "" : String(c.parentId);
    const arr = byParent.get(key) ?? [];
    arr.push(c);
    byParent.set(key, arr);
  }
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

  // bornes prix safe
  const minBoundEuros = 0;
  const maxBoundEuros = 3000;

  const data = await searchProducts({
    q,
    page,
    pageSize: 24,
    category,
    inStockOnly: false, // UI retirée pour le moment
    minPriceCents,
    maxPriceCents,
    sort: sort ?? "relevance",
  });

  const hasFilters = Boolean(q || category || minPriceEuros != null || maxPriceEuros != null);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Résultats {q ? <>pour “{q}”</> : null}</h1>

      {/* Filtres (1 ligne desktop / stack mobile) */}
      <form
        className="mt-4 flex flex-col gap-3 md:flex-row md:items-center"
        action="/search"
        method="GET"
      >
        {/* conserver le tri dans l'URL quand on filtre */}
        <input type="hidden" name="sort" value={sort} />

        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher…"
          className="w-full md:flex-1 rounded-xl border px-4 py-2"
        />

        <div className="w-full md:w-[260px] relative z-40">
          <CategorySelect items={categoryItems} defaultValue={category ?? ""} />
        </div>

        <div className="w-full md:flex-[0_0_520px]">
          <PriceRangeInline
            minBound={minBoundEuros}
            maxBound={maxBoundEuros}
            initialMin={minPriceEuros}
            initialMax={maxPriceEuros}
          />
        </div>

        <button
          className="w-full md:w-auto rounded-xl px-6 py-2.5 font-semibold text-white shadow-sm hover:brightness-95 transition"
          style={{ backgroundColor: "rgb(var(--primary))" }}
        >
          Filtrer
        </button>
      </form>

      {/* Tri (à droite, au-dessus des résultats) */}
      <div className="mt-3 flex justify-end">
        <SortSelect value={sort} />
      </div>

      {/* Résumé filtres */}
      {hasFilters && (
        <div className="mt-3 text-sm text-neutral-600">
          {category ? (
            <>
              Catégorie: <b>{category}</b> ·{" "}
            </>
          ) : null}
          {minPriceEuros != null || maxPriceEuros != null ? (
            <>
              Prix: <b>{minPriceEuros ?? minBoundEuros}</b>—<b>{maxPriceEuros ?? maxBoundEuros}</b> € ·{" "}
            </>
          ) : null}
          {data.total} produit{data.total > 1 ? "s" : ""} trouvé{data.total > 1 ? "s" : ""}.
        </div>
      )}

      {/* Résultats */}
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

      {/* Pagination */}
      {data.totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: data.totalPages }).map((_, i) => {
            const n = i + 1;
            const params = new URLSearchParams();
            if (q.trim()) params.set("q", q.trim());
            if (category) params.set("category", category);
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