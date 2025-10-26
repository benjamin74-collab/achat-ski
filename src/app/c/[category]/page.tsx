// src/app/c/[category]/page.tsx
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import ProductCard from "../../../components/ProductCard";
import FiltersBar from "../../../components/FiltersBar";
import SortSelect from "../../../components/SortSelect";
import { totalCents } from "../../../lib/format";
import Breadcrumbs from "../../../components/Breadcrumbs";
import DOMPurify from "isomorphic-dompurify";

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
    return Array.isArray(v) ? (v.filter(Boolean) as string[]) : v ? [v] : [];
  };
  return {
    page: Number(get("page") ?? "1"),
    sort: (get("sort") as SortKey | null) ?? "newest",
    brands: getAll("brand"),
    season: get("season"),
  };
}

function buildHref(
  baseQuery: { page: number; sort: SortKey; brands: string[]; season: string | null },
  nextPage: number
) {
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
  const { category } = await params; // slug de catégorie
  const parsed = parseSearchParams(searchParams);
  const { page, sort, brands, season } = parsed;

  // --- Charger la catégorie (SEO + arborescence)
  const cat = await prisma.category.findUnique({
    where: { slug: category },
    include: {
      children: {
        where: { published: true, isInMenu: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
        select: { id: true, slug: true, name: true },
      },
    },
  });
  if (!cat || !cat.published) {
    return (
      <div className="container-page py-8">
        <Breadcrumbs items={[{ href: "/", label: "Accueil" }]} />
        <h1 className="text-xl font-semibold">Catégorie introuvable</h1>
      </div>
    );
  }

  const pageSize = 12;
  const skip = (Math.max(1, page) - 1) * pageSize;

  // Listes pour filtres (marques, saisons)
  const [brandRows, seasonRows] = await Promise.all([
    prisma.product.findMany({
      where: { category: { is: { slug: category } } },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
    prisma.product.findMany({
      where: { category: { is: { slug: category } } },
      select: { season: true },
      distinct: ["season"],
      orderBy: { season: "desc" },
    }),
  ]);
  const allBrands = brandRows.map((b) => b.brand).filter(Boolean);
  const allSeasons = seasonRows.map((s) => s.season!).filter(Boolean);

  // Filtre DB typé
  const where: Prisma.ProductWhereInput = {
    category: { is: { slug: category } },
  };
  if (brands.length) where.brand = { in: brands };
  if (season) where.season = season;

  // Récup produits + offres
  const [total, productsRaw] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: sort === "newest" ? { id: "asc" } : undefined,
      skip,
      take: pageSize,
      include: {
        category: { select: { name: true, slug: true } },
        skus: { include: { offers: true } },
      },
    }),
  ]);

  // Calcul du min total (prix + port) par produit
  const products = productsRaw.map((p) => {
    const allOffers = p.skus.flatMap((s) => s.offers);
    const minTotal = allOffers.length
      ? allOffers
          .map((o) => totalCents(o.priceCents, o.shippingCents ?? 0))
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
      ? [...products].sort((a, b) => (b.minTotal ?? -1) - (a.minTotal ?? -1))
      : products;

  const pages = Math.max(1, Math.ceil(total / pageSize));

  // Sanitize HTML content
  const safeHtml = cat.content ? DOMPurify.sanitize(cat.content) : "";

  return (
    <div className="container-page py-8">
      <div className="flex flex-col gap-4 md:grid md:grid-cols-12">
        {/* Filtres (colonne gauche) */}
        <aside className="md:col-span-3">
          <FiltersBar brands={allBrands} seasons={allSeasons} />
        </aside>

        {/* Contenu (colonne droite) */}
        <div className="md:col-span-9 flex flex-col gap-4">
          <Breadcrumbs
            items={[
              { href: "/", label: "Accueil" },
              { label: "Catégories", href: "/#categories" },
              { label: cat.name },
            ]}
          />

          {/* En-tête + stats */}
          <div className="card p-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{cat.name}</h1>
              <p className="text-neutral-600 text-sm">
                {total} produit{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}.
              </p>
              {cat.intro && <p className="text-neutral-600 text-sm mt-1">{cat.intro}</p>}
            </div>
            <SortSelect />
          </div>

          {/* Contenu SEO (HTML collé) */}
          {safeHtml && (
            <section className="rounded-2xl border border-ring bg-surface/60 p-5 shadow-card">
              <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: safeHtml }} />
            </section>
          )}

          {/* Sous-catégories */}
          {cat.children.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Sous-catégories</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {cat.children.map((sc) => (
                  <li key={sc.id} className="rounded-xl border p-4 hover:bg-accent/30">
                    <a href={`/c/${sc.slug}`} className="font-medium">
                      {sc.name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Liste produits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sorted.map((p) => {
              const cardTitle = [p.brand, p.model, p.season].filter(Boolean).join(" ");
              return (
                <ProductCard
                  key={p.id}
                  href={`/p/${p.slug}`}
                  title={cardTitle}
                  subtitle={p.category?.name ?? undefined}
                  minPriceCents={p.minTotal ?? null}
                />
              );
            })}
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
  const cat = await prisma.category.findUnique({
    where: { slug: category },
    select: { name: true, metaTitle: true, metaDescription: true, intro: true, published: true },
  });

  if (!cat || !cat.published) {
    return { title: "Catégorie introuvable — Achat-Ski", description: "Cette catégorie n'existe pas ou n'est pas publiée." };
  }

  const title = cat.metaTitle || `${cat.name} — Achat-Ski`;
  const description = cat.metaDescription || cat.intro || `Guide d'achat et comparatif ${cat.name}.`;

  return { title, description };
}
