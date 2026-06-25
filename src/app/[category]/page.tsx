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
import { getCurrentSiteUrl, getCurrentSiteId } from "@/lib/currentSite";
import { getSiteConfig } from "@/config/site";

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
    page: Math.max(1, Number(get("page") ?? "1") || 1),
    sort: (get("sort") as SortKey | null) ?? "newest",
    brands: getAll("brand"),
    season: get("season"),
  };
}

function buildHref(
  baseQuery: { page: number; sort: SortKey; brands: string[]; season: string | null },
  nextPage: number,
) {
  const params = new URLSearchParams();
  params.set("sort", baseQuery.sort);
  if (baseQuery.season) params.set("season", baseQuery.season);
  for (const b of baseQuery.brands) params.append("brand", b);
  params.set("page", String(nextPage));
  return `?${params.toString()}`;
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatPriceRange(minCents: number | null, maxCents: number | null) {
  if (typeof minCents !== "number" || typeof maxCents !== "number") return null;
  return `${(minCents / 100).toFixed(0)} € à ${(maxCents / 100).toFixed(0)} €`;
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
      parent: {
        select: { slug: true, name: true },
      },
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
  const skip = (page - 1) * pageSize;

  const baseCategoryWhere: Prisma.ProductWhereInput = {
    category: { is: { slug: category } },
  };

  const [brandRows, seasonRows] = await Promise.all([
    prisma.product.findMany({
      where: baseCategoryWhere,
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
    prisma.product.findMany({
      where: baseCategoryWhere,
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
      orderBy: sort === "newest" ? { id: "desc" } : undefined,
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
    const totals = allOffers.map((o) => totalCents(o.priceCents, o.shippingCents ?? 0));
    const minTotal = totals.length ? Math.min(...totals) : null;
    const maxTotal = totals.length ? Math.max(...totals) : null;

    return {
      ...p,
      minTotal,
      maxTotal,
      offerCount: allOffers.length,
    };
  });

  const sorted =
    sort === "price-asc"
      ? [...products].sort(
          (a, b) => (a.minTotal ?? Number.POSITIVE_INFINITY) - (b.minTotal ?? Number.POSITIVE_INFINITY),
        )
      : sort === "price-desc"
        ? [...products].sort((a, b) => (b.minTotal ?? -1) - (a.minTotal ?? -1))
        : products;

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safeHtml = cat.content ? sanitizeHtml(cat.content) : "";
  const canonicalUrl = `${site}/${cat.slug}`;

  const pricedProducts = sorted.filter((p) => typeof p.minTotal === "number");
  const globalMinPrice = pricedProducts.length ? Math.min(...pricedProducts.map((p) => p.minTotal as number)) : null;
  const globalMaxPrice = pricedProducts.length ? Math.max(...pricedProducts.map((p) => p.maxTotal as number)) : null;

  const introText =
    cat.intro?.trim() ||
    `Compare les meilleurs produits de la catégorie ${cat.name}, consulte les prix disponibles et découvre les références proposées par les marchands partenaires.`;

  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Accueil", item: `${site}/` },
    { "@type": "ListItem", position: 2, name: "Catégories", item: `${site}/#categories` },
    ...(cat.parent
      ? [
          {
            "@type": "ListItem",
            position: 3,
            name: cat.parent.name,
            item: `${site}/${cat.parent.slug}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: cat.name,
            item: canonicalUrl,
          },
        ]
      : [
          {
            "@type": "ListItem",
            position: 3,
            name: cat.name,
            item: canonicalUrl,
          },
        ]),
  ];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumb`,
    itemListElement: breadcrumbItems,
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${canonicalUrl}#itemlist`,
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
      const highPrice = typeof p.maxTotal === "number" ? (p.maxTotal / 100).toFixed(2) : undefined;

      return {
        "@type": "ListItem",
        position: idx + 1,
        url,
        item: {
          "@type": "Product",
          name: title,
          url,
          category: cat.name,
          ...(lowPrice
            ? {
                offers: {
                  "@type": "AggregateOffer",
                  priceCurrency: "EUR",
                  lowPrice,
                  ...(highPrice ? { highPrice } : {}),
                  offerCount: p.offerCount,
                },
              }
            : {}),
        },
      };
    }),
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: cat.metaTitle ?? cat.name,
    description: cat.metaDescription ?? introText,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${site}/#website`,
      url: site,
    },
    breadcrumb: {
      "@id": `${canonicalUrl}#breadcrumb`,
    },
    mainEntity: {
      "@id": `${canonicalUrl}#collection`,
    },
    about: [
      {
        "@type": "Thing",
        name: cat.name,
        url: canonicalUrl,
      },
      ...cat.children.map((sc) => ({
        "@type": "Thing",
        name: sc.name,
        url: `${site}/${sc.slug}`,
      })),
    ],
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonicalUrl}#collection`,
    name: cat.name,
    description: cat.metaDescription ?? cat.intro ?? `Comparatif et prix pour ${cat.name}.`,
    url: canonicalUrl,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${site}/#website`,
    },
    breadcrumb: {
      "@id": `${canonicalUrl}#breadcrumb`,
    },
    mainEntity: {
      "@id": `${canonicalUrl}#itemlist`,
    },
  };

  const faqItems = [
    {
      q: `Quels produits trouve-t-on dans la catégorie ${cat.name} ?`,
      a:
        total > 0
          ? `Cette catégorie regroupe actuellement ${total} produit${total > 1 ? "s" : ""} liés à ${cat.name}, selon les filtres et les références disponibles sur le site.`
          : `Le contenu de cette catégorie dépend des références actuellement disponibles chez les marchands partenaires.`,
    },
    {
      q: `Comment comparer les prix dans la catégorie ${cat.name} ?`,
      a: `Tu peux consulter les fiches produits de la catégorie ${cat.name} pour comparer les offres, les marchands et les différents niveaux de prix disponibles.`,
    },
    {
      q: `Peut-on filtrer les produits ${cat.name} par marque ou saison ?`,
      a: `Oui, lorsque les données sont disponibles, la page permet de filtrer les résultats par marque et par saison afin d’affiner la comparaison.`,
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${canonicalUrl}#faq`,
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <div className="container-page py-8">
      <link rel="canonical" href={canonicalUrl} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="flex flex-col gap-6 md:grid md:grid-cols-12">
        <aside className="md:col-span-3">
          <div className="md:sticky md:top-24">
            <FiltersBar brands={allBrands} seasons={allSeasons} />
          </div>
        </aside>

        <div className="md:col-span-9 flex flex-col gap-6">
          <Breadcrumbs
            items={[
              { href: "/", label: "Accueil" },
              { label: "Catégories", href: "/#categories" },
              ...(cat.parent ? [{ label: cat.parent.name, href: `/${cat.parent.slug}` }] : []),
              { label: cat.name },
            ]}
          />

          <header className="rounded-3xl border border-ring bg-white p-5 md:p-7 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-ring bg-muted/40 px-3 py-1 text-xs font-medium text-slate-700">
                Catégorie
              </span>
              <span className="inline-flex rounded-full border border-ring bg-muted/40 px-3 py-1 text-xs font-medium text-slate-700">
                {total} résultat{total > 1 ? "s" : ""}
              </span>
              {cat.children.length > 0 ? (
                <span className="inline-flex rounded-full border border-ring bg-muted/40 px-3 py-1 text-xs font-medium text-slate-700">
                  {cat.children.length} sous-catégorie{cat.children.length > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900">
                  {cat.name}
                </h1>
                <p className="mt-3 max-w-3xl text-sm md:text-base leading-relaxed text-slate-700">
                  {introText}
                </p>
              </div>

              <div className="w-full lg:w-auto">
                <SortSelect />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-ring bg-muted/20 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Produits</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{total}</div>
              </div>

              <div className="rounded-2xl border border-ring bg-muted/20 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Marques</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{allBrands.length || "—"}</div>
              </div>

              <div className="rounded-2xl border border-ring bg-muted/20 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Plage de prix</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {formatPriceRange(globalMinPrice, globalMaxPrice) ?? "Non disponible"}
                </div>
              </div>
            </div>
          </header>

          <section id="produits" className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                  Produits {cat.name}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Compare les références actuellement disponibles dans cette catégorie.
                </p>
              </div>
              <div className="text-sm text-slate-500">
                Page {page} / {pages}
              </div>
            </div>

            {sorted.length > 0 ? (
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
            ) : (
              <div className="rounded-2xl border border-ring bg-white p-5 text-sm text-slate-600 shadow-card">
                Aucun produit ne correspond aux filtres sélectionnés.
              </div>
            )}
          </section>

          {pages > 1 && (
            <nav className="flex items-center gap-2">
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

          {cat.children.length > 0 && (
            <section className="rounded-3xl border border-ring bg-white p-5 md:p-6 shadow-card">
              <h2 className="text-xl font-semibold text-slate-900">Sous-catégories</h2>
              <p className="mt-2 text-sm text-slate-600">
                Explore les sous-catégories liées à {cat.name} pour affiner ta recherche.
              </p>

              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {cat.children.map((sc) => (
                  <li key={sc.id}>
                    <Link
                      href={`/${sc.slug}`}
                      className="block rounded-2xl border border-ring bg-muted/20 px-4 py-4 font-medium text-slate-900 transition hover:bg-muted/40"
                    >
                      {sc.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {safeHtml && (
            <section className="rounded-3xl border border-ring bg-surface/60 p-5 md:p-6 shadow-card">
              <h2 className="text-xl font-semibold text-slate-900">Guide et présentation</h2>
              <article
                className="prose prose-slate max-w-none mt-4"
                dangerouslySetInnerHTML={{ __html: safeHtml }}
              />
            </section>
          )}

          <section className="rounded-3xl border border-ring bg-white p-5 md:p-6 shadow-card">
            <h2 className="text-xl font-semibold text-slate-900">Pourquoi consulter cette catégorie ?</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-ring bg-muted/20 p-4">
                <h3 className="font-semibold text-slate-900">Comparer les produits</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Accède rapidement aux références disponibles dans l’univers {cat.name}.
                </p>
              </div>

              <div className="rounded-2xl border border-ring bg-muted/20 p-4">
                <h3 className="font-semibold text-slate-900">Repérer les prix</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Consulte les fiches produits pour comparer les offres et les niveaux de prix.
                </p>
              </div>

              <div className="rounded-2xl border border-ring bg-muted/20 p-4">
                <h3 className="font-semibold text-slate-900">Affiner ton choix</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Utilise les filtres de marque et de saison pour cibler les modèles les plus pertinents.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-ring bg-surface/60 p-5 md:p-6 shadow-card">
            <h2 className="text-xl font-semibold text-slate-900">FAQ sur {cat.name}</h2>

            <div className="mt-4 space-y-4">
              {faqItems.map((item) => (
                <div key={item.q} className="rounded-2xl border border-ring bg-white p-4">
                  <h3 className="text-base font-semibold text-slate-900">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }) {
  const { category } = await params;

  const siteId = await getCurrentSiteId();
  const siteConfig = getSiteConfig(siteId);
  const site = await getCurrentSiteUrl();

  const cat = await prisma.category.findUnique({
    where: { slug: category },
    select: {
      name: true,
      metaTitle: true,
      metaDescription: true,
      intro: true,
      content: true,
      published: true,
      slug: true,
    },
  });

  if (!cat || !cat.published) {
    return {
      title: `Catégorie introuvable — ${siteConfig.name}`,
      description: "Cette catégorie n'existe pas ou n'est pas publiée.",
    };
  }

  const url = `${site}/${cat.slug}`;

  const fallbackDescription =
    cat.metaDescription ||
    cat.intro ||
    (cat.content ? stripHtml(cat.content).slice(0, 160) : `Guide d'achat et comparatif ${cat.name}.`);

  const metaTitle = cat.metaTitle || `${cat.name} : comparatif, prix et guide d’achat`;

  return {
    title: metaTitle,
    description: fallbackDescription,
    alternates: { canonical: url },
    openGraph: {
      title: metaTitle,
      description: fallbackDescription,
      url,
    },
  };
}