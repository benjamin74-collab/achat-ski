import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import ProductCard from "../../../components/ProductCard";
import FiltersBar from "../../../components/FiltersBar";
import SortSelect from "../../../components/SortSelect";
import { categoryLabel } from "../../../lib/categories";
import { totalCents } from "../../../lib/format";
import Breadcrumbs from "../../../components/Breadcrumbs";

export const revalidate = 120;

type PageParams = { category: string };
type SortKey = "newest" | "price-asc" | "price-desc";

function parseSearchParams(input?: { [key: string]: string | string[] | undefined }) {
  const get = (k: string): string | null => {
    const v = input?.[k];
    return Array.isArray(v) ? v[0] ?? null : (v ?? null);
  };
  const getAll = (k: string): string[] => {
    const v = input?.[k];
    return Array.isArray(v) ? v.filter(Boolean) as string[] : v ? [v] : [];
  };
  return {
    page: Number(get("page") ?? "1"),
    sort: (get("sort") as SortKey | null) ?? "newest",
    brands: getAll("brand"),
    season: get("season"),
  };
}

function buildHref(baseQuery: { page: number; sort: SortKey; brands: string[]; season: string | null }, nextPage: number) {
  const params = new URLSearchParams();
  params.set("sort", baseQuery.sort);
  if (baseQuery.season) params.set("season", baseQuery.season);
  for (const b of baseQuery.brands) params.append("brand", b);
  params.set("page", String(nextPage));
  return `?${params.toString()}`;
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { category } = await params;
  const parsed = parseSearchParams(searchParams);
  const { page, sort, brands, season } = parsed;

  const pageSize = 12;
  const skip = (Math.max(1, page) - 1) * pageSize;

  // listes pour filtres (marques, saisons)
  const [brandRows, seasonRows] = await Promise.all([
    prisma.product.findMany({
      where: { category },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
    prisma.product.findMany({
      where: { category },
      select: { season: true },
      distinct: ["season"],
      orderBy: { season: "desc" },
    }),
  ]);
  const allBrands = brandRows.map(b => b.brand).filter(Boolean);
  const allSeasons = seasonRows.map(s => s.season!).filter(Boolean);

  // Filtre DB typé
  const where: Prisma.ProductWhereInput = { category };
  if (brands.length) where.brand = { in: brands };
  if (season) where.season = season;

  // Récup produits + offres (pour calcul min total côté serveur)
  const [total, productsRaw] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: sort === "newest" ? { id: "desc" } : undefined, // tri par défaut pour "newest"
      skip,
      take: pageSize,
      include: {
        skus: { include: { offers: true } },
      },
    }),
  ]);

  // Calcul du min total (prix + port) par produit
  const products = productsRaw.map(p => {
    const allOffers = p.skus.flatMap(s => s.offers);
    const minTotal = allOffers.length
      ? allOffers
          .map(o => totalCents(o.priceCents, o.shippingCents ?? 0))
          .reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY)
      : null;
    return { ...p, minTotal };
  });

  // Tri en mémoire si tri par prix
  const sorted =
    sort === "price-asc"
      ? [...products].sort(
          (a, b) => (a.minTotal ?? Number.POSITIVE_INFINITY) - (b.minTotal ?? Number.POSITIVE_INFINITY)
        )
      : sort === "price-desc"
      ? [...products].sort(
          (a, b) => (b.minTotal ?? -1) - (a.minTotal ?? -1)
        )
      : products;

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const title = categoryLabel(category);

  return (
    <div className="container-page py-8">
      <div className="flex flex-col gap-4 md:grid md:grid-cols-12">
        {/* Filtres (colonne gauche) */}
        <aside className="md:col-span-3">
          <FiltersBar brands={allBrands} seasons={allSeasons} />
        </aside>

        {/* Contenu (colonne droite) */}
        <div className="md:col-span-9 flex flex-col gap-4">
			<Breadcrumbs items={[
			  { href: "/", label: "Accueil" },
			  { label: "Catégories", href: "/#categories" },
			  { label: title }
			]} />
          <div className="card p-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              <p className="text-neutral-600 text-sm">
                {total} produit{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}.
              </p>
            </div>
            <SortSelect />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sorted.map((p) => (
              <ProductCard
                key={p.id}
                slug={p.slug}
                brand={p.brand}
                model={p.model}
                season={p.season}
                minTotalCents={p.minTotal}
                currency="EUR"
              />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <nav className="mt-2 mb-4 flex items-center gap-2">
              <Link
                className={`btn ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
                href={buildHref({ ...parsed, page }, page - 1)}
                aria-disabled={page <= 1}
              >
                ← Précédent
              </Link>
              <span className="text-sm text-neutral-600">
                Page {page} / {pages}
              </span>
              <Link
                className={`btn ${page >= pages ? "pointer-events-none opacity-50" : ""}`}
                href={buildHref({ ...parsed, page }, page + 1)}
                aria-disabled={page >= pages}
              >
                Suivant →
              </Link>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }) {
  const { category } = await params;
  const title = `${categoryLabel(category)} — Achat-Ski`;
  return {
    title,
    description: `Comparez les prix des produits ${categoryLabel(category)} chez nos marchands partenaires.`,
  };
}
