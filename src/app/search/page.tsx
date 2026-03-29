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
  const b1 = row["active"];
  if (typeof b1 === "boolean") return b1;

  const b2 = row["isActive"];
  if (typeof b2 === "boolean") return b2;

  const b3 = row["enabled"];
  if (typeof b3 === "boolean") return b3;

  const b4 = row["published"];
  if (typeof b4 === "boolean") return b4;

  const s = row["status"];
  if (typeof s === "string") {
    const up = s.toUpperCase();
    if (up === "ACTIVE" || up === "ENABLED" || up === "PUBLISHED") return true;
    if (up === "INACTIVE" || up === "DISABLED" || up === "DRAFT") return false;
  }

  return true;
}

function isBrandActiveUnknown(row: Record<string, unknown>): boolean {
  const b1 = row["active"];
  if (typeof b1 === "boolean") return b1;

  const b2 = row["isActive"];
  if (typeof b2 === "boolean") return b2;

  const b3 = row["enabled"];
  if (typeof b3 === "boolean") return b3;

  const b4 = row["published"];
  if (typeof b4 === "boolean") return b4;

  const s = row["status"];
  if (typeof s === "string") {
    const up = s.toUpperCase();
    if (up === "ACTIVE" || up === "ENABLED" || up === "PUBLISHED") return true;
    if (up === "INACTIVE" || up === "DISABLED" || up === "DRAFT") return false;
  }

  return true;
}

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const q = (searchParams?.q as string) ?? "";
  const page = Number((searchParams?.page as string) ?? "1") || 1;
  const category = (searchParams?.category as string) || undefined;
  const sort = ((searchParams?.sort as string) || "relevance") as Sort;

  const minPriceEuros = parseIntOrNull(searchParams?.min as string | undefined);
  const maxPriceEuros = parseIntOrNull(searchParams?.max as string | undefined);
  const minPriceCents = minPriceEuros != null ? minPriceEuros * 100 : null;
  const maxPriceCents = maxPriceEuros != null ? maxPriceEuros * 100 : null;

  const catsRaw = await prisma.category.findMany({
    orderBy: [{ name: "asc" }],
  });

  const cats = catsRaw.filter((c) => isCategoryActiveUnknown(c as unknown as Record<string, unknown>));

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

  const minBoundEuros = 0;
  const maxBoundEuros = 3000;

  const data = await searchProducts({
    q,
    page,
    pageSize: 24,
    category,
    inStockOnly: false,
    minPriceCents,
    maxPriceCents,
    sort: sort ?? "relevance",
  });

  const brandsRaw =
    q.trim().length > 0
      ? await prisma.brand.findMany({
          where: {
            OR: [
              { name: { contains: q.trim(), mode: "insensitive" } },
              { slug: { contains: q.trim(), mode: "insensitive" } },
            ],
          },
          orderBy: [{ name: "asc" }],
          take: 8,
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            active: true,
          },
        })
      : [];

  const brands = brandsRaw
    .filter((b) => isBrandActiveUnknown(b as unknown as Record<string, unknown>))
    .map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
    }));

  const hasFilters = Boolean(q || category || minPriceEuros != null || maxPriceEuros != null);
  const totalResults = data.total + brands.length;

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Résultats {q ? <>pour “{q}”</> : null}</h1>

      <form
        className="mt-4 flex flex-col gap-3 md:flex-row md:items-center"
        action="/search"
        method="GET"
      >
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

      <div className="mt-3 flex justify-end">
        <SortSelect value={sort} />
      </div>

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
          {brands.length} marque{brands.length > 1 ? "s" : ""} et {data.total} produit{data.total > 1 ? "s" : ""} trouvé{totalResults > 1 ? "s" : ""}.
        </div>
      )}

      {brands.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-semibold">Marques</h2>
            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">
              Résultats marque
            </span>
          </div>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <li
                key={brand.id}
                className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 hover:shadow-sm transition"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex w-fit rounded-full bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white">
                      Marque
                    </span>
                  </div>

                  <Link
                    href={`/marques/${brand.slug}`}
                    className="text-lg font-semibold text-violet-900 hover:underline"
                  >
                    {brand.name}
                  </Link>

                  <p className="text-sm text-violet-900/80">
                    {brand.description?.trim()
                      ? `${brand.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140)}${brand.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length > 140 ? "…" : ""}`
                      : "Accéder à la page dédiée de cette marque."}
                  </p>

                  <div className="mt-1">
                    <Link
                      href={`/marques/${brand.slug}`}
                      className="inline-block rounded-xl border border-violet-300 bg-white px-3 py-2 text-sm font-medium text-violet-800 hover:shadow"
                    >
                      Voir la marque
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold">Produits</h2>
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
            Résultats produit
          </span>
        </div>

        {data.items.length === 0 ? (
          <p className="text-neutral-600">Aucun produit ne correspond aux filtres.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </section>

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