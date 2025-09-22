import { searchProducts } from "@/lib/search";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";

function formatPrice(cents: number | null) {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export const dynamic = "force-dynamic"; // si tu veux éviter la mise en cache statique

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; category?: string; stock?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const page = Number(searchParams.page ?? "1") || 1;
  const category = searchParams.category || undefined;
  const inStockOnly = (searchParams.stock ?? "").toLowerCase() === "1";

  const res = await searchProducts({ q, page, pageSize: 20, category, inStockOnly });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Recherche</h1>

      <SearchBar />

      <div className="flex gap-2 text-sm">
        <Link
          href={`/search?${new URLSearchParams({ q, ...(category ? { category } : {}), ...(inStockOnly ? { stock: "1" } : {}) }).toString()}`}
          className="hidden"
        />
        {/* Filtres simples */}
        <form className="flex items-center gap-2">
          <select
            name="category"
            defaultValue={category ?? ""}
            className="rounded-lg border px-3 py-2"
            onChange={(e) => {
              const params = new URLSearchParams();
              if (q) params.set("q", q);
              if (e.target.value) params.set("category", e.target.value);
              if (inStockOnly) params.set("stock", "1");
              window.location.href = `/search?${params.toString()}`;
            }}
          >
            <option value="">Toutes catégories</option>
            <option value="skis-all-mountain">Skis all-mountain</option>
            <option value="skis-freeride">Skis freeride</option>
            <option value="skis-rando">Skis rando</option>
            <option value="fixations">Fixations</option>
            <option value="chaussures">Chaussures</option>
          </select>

          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              defaultChecked={inStockOnly}
              onChange={(e) => {
                const params = new URLSearchParams();
                if (q) params.set("q", q);
                if (category) params.set("category", category);
                if (e.target.checked) params.set("stock", "1");
                window.location.href = `/search?${params.toString()}`;
              }}
            />
            En stock
          </label>
        </form>
      </div>

      <p className="text-sm opacity-70">
        {res.total} résultat{res.total > 1 ? "s" : ""}{q ? <> pour <span className="font-medium">{q}</span></> : null}
      </p>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {res.items.map((p) => (
          <li key={p.id} className="rounded-2xl border p-4 hover:shadow-sm transition">
            <Link href={`/p/${p.slug}`} className="block">
              <div className="text-sm opacity-60">{p.brand} {p.season ? `• ${p.season}` : ""}</div>
              <div className="text-lg font-semibold">{p.model}</div>
              <div className="mt-2 text-blue-600 font-medium">
                {formatPrice(p.minPriceCents)} {p.offerCount ? <span className="text-sm opacity-70">({p.offerCount} offre{p.offerCount>1?"s":""})</span> : null}
              </div>
              {p.category && <div className="mt-1 text-xs opacity-60">Catégorie : {p.category}</div>}
            </Link>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      {res.totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: res.totalPages }, (_, i) => i + 1).map((n) => {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (category) params.set("category", category);
            if (inStockOnly) params.set("stock", "1");
            params.set("page", String(n));
            const href = `/search?${params.toString()}`;
            const active = n === res.page;
            return (
              <a
                key={n}
                href={href}
                className={`rounded-lg border px-3 py-1 text-sm ${active ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"}`}
              >
                {n}
              </a>
            );
          })}
        </nav>
      )}
    </main>
  );
}
