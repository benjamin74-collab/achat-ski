// src/app/b/[brand]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";

export const runtime = "nodejs";
export const revalidate = 60;

type SP = { [k: string]: string | string[] | undefined };

function parsePage(v: string | undefined) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: { brand: string };
  searchParams: SP;
}) {
  const brandParam = decodeURIComponent(params.brand || "");
  if (!brandParam) return notFound();

  const page = parsePage(searchParams?.page as string);
  const pageSize = 24;
  const skip = (page - 1) * pageSize;

  // Filtre optionnel catégorie + stock
  const category = (searchParams?.category as string) || undefined;
  const inStockOnly = ((searchParams?.stock as string) ?? "").toLowerCase() === "1";

  // On récupère les produits de la marque (case-insensitive) + leurs offres
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: {
        brand: { equals: brandParam, mode: "insensitive" },
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        skus: {
          include: {
            offers: {
              where: inStockOnly ? { inStock: true } : undefined,
            },
          },
        },
      },
    }),
    prisma.product.count({
      where: {
        brand: { equals: brandParam, mode: "insensitive" },
        ...(category ? { category } : {}),
      },
    }),
  ]);

  if (page > 1 && products.length === 0) return notFound();

  // Calcule prix mini en stock + nb d'offres
  const items = products.map((p) => {
    const offers = p.skus.flatMap((s) => s.offers);
    const offerCount = offers.length;
    const minPriceCents =
      offerCount > 0
        ? offers
            .map((o) => o.priceCents + (o.shippingCents ?? 0))
            .reduce((a, v) => (a == null || v < a ? v : a), null as number | null)
        : null;

    return {
      id: p.id,
      slug: p.slug,
      brand: p.brand,
      model: p.model,
      season: p.season,
      category: p.category,
      offerCount,
      minPriceCents,
    };
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
      <nav className="text-sm text-neutral-600">
        <Link href="/" className="hover:underline">Accueil</Link> · <span>Marque</span> · <b>{brandParam}</b>
      </nav>

      <h1 className="mt-2 text-2xl font-semibold">Produits {brandParam}</h1>

      {/* Filtres simples */}
      <form className="mt-4 flex flex-wrap gap-2" action={`/b/${encodeURIComponent(brandParam)}`} method="GET">
        <select name="category" defaultValue={category ?? ""} className="rounded-xl border px-3 py-2">
          <option value="">Toutes catégories</option>
          <option value="skis-all-mountain">Skis All-Mountain</option>
          <option value="skis-freeride">Skis Freeride</option>
          <option value="skis-rando">Skis de rando</option>
          <option value="fixations">Fixations</option>
          <option value="chaussures">Chaussures</option>
        </select>
        <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
          <input type="checkbox" name="stock" value="1" defaultChecked={inStockOnly} />
          En stock
        </label>
        <input type="hidden" name="page" value="1" />
        <button className="rounded-xl border px-4 py-2">Filtrer</button>
      </form>

      {/* Grille produits */}
      {items.length === 0 ? (
        <p className="mt-6 text-neutral-600">Aucun produit pour ces filtres.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <li key={p.id} className="rounded-2xl border p-4 hover:shadow-sm transition">
              <Link href={`/p/${p.slug}`} className="block">
                <div className="aspect-[4/3] w-full rounded-xl bg-gray-50 border" />
                <div className="mt-2 text-lg font-medium truncate">
                  {[p.brand, p.model, p.season].filter(Boolean).join(" ")}
                </div>
                <div className="text-sm text-neutral-600">
                  {p.category ?? "—"} · {p.offerCount} offre{p.offerCount && p.offerCount > 1 ? "s" : ""}
                </div>
                <div className="mt-1 text-right">
                  <div className="text-xs text-neutral-500">à partir de</div>
                  <div className="text-lg font-semibold">
                    {p.minPriceCents != null ? money(p.minPriceCents, "EUR") : "—"}
                  </div>
                </div>
              </Link>
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
            params.set("page", String(n));
            return (
              <Link
                key={n}
                href={`/b/${encodeURIComponent(brandParam)}?${params.toString()}`}
                className={`rounded-md px-3 py-1 text-sm ${n === page ? "bg-black text-white" : "border hover:bg-gray-50"}`}
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
