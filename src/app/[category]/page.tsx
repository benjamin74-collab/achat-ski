// src/app/[category]/page.tsx
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import ProductCard from "../../components/ProductCard";
import FiltersBar from "../../components/FiltersBar";
import SortSelect from "../../components/SortSelect";
import { totalCents } from "../../lib/format";
import Breadcrumbs from "../../components/Breadcrumbs";
import { sanitizeHtml } from "../../lib/sanitize";
import { getCurrentSiteUrl } from "@/lib/currentSite";

export const revalidate = 120;

type PageParams = { category: string };
type SortKey = "newest" | "price-asc" | "price-desc";

function getSiteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/+$/, "");
  return "https://meilleur-ski.com";
}

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
  const site = await getCurrentSiteUrl();

  const { category } = await params;
  const parsed = parseSearchParams(searchParams);
  const { page, sort, brands, season } = parsed;

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

  const allBrands: string[] = brandRows
    .map((b) => b.brand)
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  const allSeasons: string[] = seasonRows
    .map((s) => s.season)
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  const where: Prisma.ProductWhereInput = {
    category: { is: { slug: category } },
  };
  if (brands.length) where.brand = { in: brands };
  if (season) where.season = season;

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

  const products = productsRaw.map((p) => {
    const allOffers = p.skus.flatMap((s) => s.offers);
    const minTotal = allOffers.length
      ? allOffers
          .map((o) => totalCents(o.priceCents, o.shippingCents ?? 0))
          .reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY)
      : null;
    return { ...p, minTotal };
  });

  const sorted =
    sort === "price-asc"
      ? [...products].sort(
          (a, b) => (a.minTotal ?? Number.POSITIVE_INFINITY) - (b.minTotal ?? Number.POSITIVE_INFINITY)
        )
      : sort === "price-desc"
      ? [...products].sort((a, b) => (b.minTotal ?? -1) - (a.minTotal ?? -1))
      : products;

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safeHtml = cat.content ? sanitizeHtml(cat.content) : "";

  // ✅ Canonical URL courte
  const canonicalUrl = `${site}/${cat.slug}`;

  // JSON-LD: BreadcrumbList + ItemList + CollectionPage
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${site}/` },
      { "@type": "ListItem", position: 2, name: "Catégories", item: `${site}/#categories` },
      { "@type": "ListItem", position: 3, name: cat.name, item: canonicalUrl },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Produits — ${cat.name}`,
    itemListOrder:
      sort === "price-asc"
        ? "http://schema.org/ItemListOrderAscending"
        : sort === "price-desc"
        ? "http://schema.org/ItemListOrderDescending"
        : "http://schema.org/ItemListUnordered",
    numberOfItems: sorted.length,
    itemListElement: sorted.map((p, idx) => {
      const title = [p.brand, p.model, p.season].filter(Boolean).join(" ");
      const url = `${site}/p/${p.slug}`;
      const lowPrice = typeof p.minTotal === "number" ? (p.minTotal / 100).toFixed(2) : undefined;

      return {
        "@type": "ListItem",
        position: idx + 1,
        url,
        item: {
          "@type": "Product",
          name: title,
          url,
          ...(lowPrice
            ? {
                offers: {
                  "@type": "AggregateOffer",
                  priceCurrency: "EUR",
                  lowPrice,
                },
              }
            : {}),
        },
      };
    }),
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: cat.name,
    description: cat.metaDescription ?? cat.intro ?? `Comparatif et prix pour ${cat.name}.`,
    url: canonicalUrl,
  };

  return (
    <div className="container-page py-8">
      <link rel="canonical" href={canonicalUrl} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      <div className="flex flex-col gap-4 md:grid md:grid-cols-12">
        <aside className="md:col-span-3">
          <FiltersBar brands={allBrands} seasons={allSeasons} />
        </aside>

        <div className="md:col-span-9 flex flex-col gap-4">
          <Breadcrumbs
            items={[
              { href: "/", label: "Accueil" },
              { label: "Catégories", href: "/#categories" },
              { label: cat.name },
            ]}
          />

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

          {safeHtml && (
            <section className="rounded-2xl border border-ring bg-surface/60 p-5 shadow-card">
              <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: safeHtml }} />
            </section>
          )}

          {cat.children.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Sous-catégories</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {cat.children.map((sc) => (
                  <li key={sc.id} className="rounded-xl border p-4 hover:bg-accent/30">
                    <a href={`/${sc.slug}`} className="font-medium">
                      {sc.name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

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
    select: { name: true, metaTitle: true, metaDescription: true, intro: true, published: true, slug: true },
  });

  if (!cat || !cat.published) {
    return {
      title: "Catégorie introuvable — Meilleur-Ski",
      description: "Cette catégorie n'existe pas ou n'est pas publiée.",
    };
  }

  const site = await getCurrentSiteUrl();
  const url = `${site}/${cat.slug}`;

  const title = cat.metaTitle || `${cat.name} — Meilleur-Ski`;
  const description = cat.metaDescription || cat.intro || `Guide d'achat et comparatif ${cat.name}.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
  };
}
