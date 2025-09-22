// src/app/search/page.tsx
import Link from "next/link";
import { searchProducts } from "@/lib/search";
import { money } from "@/lib/format";

export const runtime = "nodejs";

type SP = { [key: string]: string | string[] | undefined };

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const q = (searchParams?.q as string) ?? "";
  const page = Number((searchParams?.page as string) ?? "1") || 1;
  const category = (searchParams?.category as string) || undefined;
  const inStockOnly = ((searchParams?.stock as string) ?? "").toLowerCase() === "1";

  const data = await searchProducts({ q, page, pageSize: 20, category, inStockOnly });

  return (
    <main className="container mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-semibold">
        Résultats de recherche {q ? <>pour “{q}”</> : null}
      </h1>

      {/* Filtres rapides */}
      <form className="mt-4 flex flex-wrap items-center gap-3">
        <input
          defaultValue={q}
          name="q"
          placeholder="Rechercher…"
          className="rounded-xl border px-4 py-2"
        />
        <select name="category" defaultValue={category ?? ""} className="rounded-xl border px-3 py-2">
          <option value="">Toutes catégories</option>
          <option value="skis-all-mountain">Skis All-Mountain</option>
          <option value="skis-freeride">Skis Freeride</option>
          <option value="skis-rando">Skis de rando</option>
          <option value="fixations">Fixations</option>
          <option value="chaussures">Chaussures</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="stock" value="1" defaultChecked={inStockOnly} />
          En stock seulement
        </label>
        <button className="rounded-xl border px-4 py-2">Filtrer</button>
      </form>

      {/* Résultats */}
      {data.items.length === 0 ? (
        <p className="mt-6 text-neutral-600">Aucun produit trouvé.</p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {data.items.map((p) => (
            <li key={p.id} className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Link href={`/p/${p.slug}`} className="text-lg font-medium hover:underline">
                    {[p.brand, p.model, p.season].filter(Boolean).join(" ")}
                  </Link>
                  <div className="text-sm text-neutral-600">
                    {p.category ?? "—"} · {p.offerCount} offre{p.offerCount > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-neutral-500">à partir de</div>
                  <div className="text-lg font-semibold">
                    {p.minPriceCents != null ? money(p.minPriceCents, "EUR") : "—"}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination simple */}
      {data.totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: data.totalPages }).map((_, i) => {
            const n = i + 1;
            const params = new URLSearchParams();
            if (q.trim()) params.set("q", q.trim());
            if (category) params.set("category", category);
            if (inStockOnly) params.set("stock", "1");
            params.set("page", String(n));
            const href = `/search?${params.toString()}`;
            return (
              <Link
                key={n}
                href={href}
                className={`rounded-md px-3 py-1 text-sm ${n === page ? "bg-black text-white" : "border"}`}
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
