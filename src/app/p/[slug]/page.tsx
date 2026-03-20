// src/app/p/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PriceTable from "@/components/PriceTable";
import Breadcrumbs from "@/components/Breadcrumbs";
import { money } from "@/lib/format";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { slugify } from "@/lib/slug";
import { getCurrentSiteUrl, getCurrentSiteId } from "@/lib/currentSite";
import { getSiteConfig } from "@/config/site";

export const runtime = "nodejs";
export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;

  const siteId = await getCurrentSiteId();
  const siteConfig = getSiteConfig(siteId);
  const site = await getCurrentSiteUrl();

  const p = await prisma.product.findUnique({
    where: { slug },
    select: {
      brand: true,
      model: true,
      season: true,
      slug: true,
      description: true,
      category: { select: { name: true } },
    },
  });

  if (!p) return { title: "Produit introuvable" };

  const name = [p.brand, p.model, p.season].filter(Boolean).join(" ");
  const url = `${site}/p/${p.slug}`;
  const desc =
    p.description?.trim() ||
    `Compare les prix ${name} chez les meilleurs marchands partenaires, consulte les tests et les avis disponibles.`;

  return {
    title: `${name} — meilleur prix`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: `${name} — meilleur prix`,
      description: desc,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — meilleur prix`,
      description: desc,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const site = await getCurrentSiteUrl();
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: { select: { name: true, slug: true } },
      Brand: { select: { id: true, name: true, slug: true } },
      skus: {
        select: {
          id: true,
          variant: true,
          gtin: true,
          offers: {
            select: {
              id: true,
              skuId: true,
              merchantId: true,
              affiliateUrl: true,
              priceCents: true,
              currency: true,
              inStock: true,
              shippingCents: true,
              lastSeen: true,
              merchant: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          authorName: true,
          sourceName: true,
          sourceUrl: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      tests: {
        where: { status: "APPROVED" },
        select: {
          id: true,
          title: true,
          excerpt: true,
          score: true,
          sourceName: true,
          sourceUrl: true,
          publishedAt: true,
          ratings: {
            select: {
              score: true,
              category: {
                select: {
                  id: true,
                  label: true,
                  slug: true,
                  order: true,
                },
              },
            },
          },
        },
        orderBy: { publishedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!product) return notFound();

  const offersFlat = product.skus.flatMap((s) =>
    s.offers.map((o) => ({
      id: o.id,
      productId: product.id,
      merchantName: o.merchant.name,
      merchantSlug: o.merchant.slug,
      priceCents: o.priceCents,
      shippingCents: o.shippingCents,
      currency: o.currency,
      inStock: o.inStock,
      lastSeen: o.lastSeen?.toISOString() ?? null,
      affiliateUrl: o.affiliateUrl,
    })),
  );

  const title = [product.Brand?.name ?? product.brand, product.model, product.season]
    .filter(Boolean)
    .join(" ");

  const minPriceCents = offersFlat
    .filter((o) => o.inStock)
    .reduce<number | null>((acc, o) => {
      const total = o.priceCents + (o.shippingCents ?? 0);
      return acc == null || total < acc ? total : acc;
    }, null);

  const specs: Array<[string, string]> = [
    ["Marque", product.Brand?.name ?? product.brand ?? "—"],
    ["Modèle", product.model ?? "—"],
    ["Saison", product.season ?? "—"],
    ["Catégorie", product.category?.name ?? "—"],
  ];

  const brandWhere: Prisma.ProductWhereInput =
    typeof product.Brand?.id === "number"
      ? { brandId: product.Brand.id }
      : product.brand
        ? { brand: product.brand }
        : {};

  const related = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      ...brandWhere,
      ...(product.category?.slug ? { category: { is: { slug: product.category.slug } } } : {}),
    },
    take: 6,
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, brand: true, model: true, season: true },
  });

  const canonicalUrl = `${site}/p/${product.slug}`;

  const reviewCount = product.reviews.length;
  const averageRating =
    reviewCount > 0 ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : null;

  const tests = product.tests;

  type CategoryAgg = {
    id: number;
    slug: string;
    label: string;
    order: number;
    sum: number;
    count: number;
  };

  const categoryMap = new Map<number, CategoryAgg>();

  for (const t of tests) {
    for (const r of t.ratings ?? []) {
      const c = r.category;
      if (!c) continue;
      const existing = categoryMap.get(c.id) ?? {
        id: c.id,
        slug: c.slug,
        label: c.label,
        order: c.order ?? 0,
        sum: 0,
        count: 0,
      };
      existing.sum += r.score;
      existing.count += 1;
      categoryMap.set(c.id, existing);
    }
  }

  const categoryRatings = Array.from(categoryMap.values())
    .map((c) => ({
      ...c,
      avg: c.count > 0 ? c.sum / c.count : 0,
    }))
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));

  const inStockOffers = offersFlat.filter((o) => o.inStock);
  const hasStock = inStockOffers.length > 0;

  const minPriceOffer =
    inStockOffers.length > 0
      ? [...inStockOffers].sort(
          (a, b) => a.priceCents + (a.shippingCents ?? 0) - (b.priceCents + (b.shippingCents ?? 0)),
        )[0]
      : undefined;

  const currency = minPriceOffer?.currency ?? "EUR";
  const minPriceEuro =
    minPriceOffer != null ? (minPriceOffer.priceCents + (minPriceOffer.shippingCents ?? 0)) / 100 : undefined;

  const maxPriceEuro = offersFlat.length
    ? Math.max(...offersFlat.map((o) => (o.priceCents + (o.shippingCents ?? 0)) / 100))
    : undefined;

  const reviewJsonLd =
    reviewCount > 0
      ? product.reviews.slice(0, 3).map((r) => ({
          "@type": "Review",
          author: {
            "@type": "Person",
            name: r.authorName || r.sourceName || "Utilisateur",
          },
          datePublished: r.createdAt.toISOString(),
          name: r.title || `${title} — avis`,
          reviewBody: r.body,
          reviewRating: {
            "@type": "Rating",
            ratingValue: r.rating,
            bestRating: 5,
            worstRating: 1,
          },
        }))
      : undefined;

  const desc = product.description?.trim() ?? null;
  const pageDescription =
    desc ||
    `Compare les prix ${title}, consulte les avis, les tests et les offres disponibles chez les marchands partenaires.`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${site}/` },
      ...(product.category?.name && product.category?.slug
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: product.category.name,
              item: `${site}/c/${product.category.slug}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: title,
              item: canonicalUrl,
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 2,
              name: title,
              item: canonicalUrl,
            },
          ]),
    ],
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonicalUrl}#product`,
    name: title,
    description: pageDescription,
    url: canonicalUrl,
    brand: (product.Brand?.name ?? product.brand)
      ? {
          "@type": "Brand",
          name: product.Brand?.name ?? product.brand,
          ...(product.Brand?.slug ? { url: `${site}/marques/${product.Brand.slug}` } : {}),
        }
      : undefined,
    sku: product.skus?.[0]?.variant ?? undefined,
    gtin13: product.skus?.[0]?.gtin ?? undefined,
    category: product.category?.name ?? undefined,
    ...(offersFlat.length > 0
      ? {
          offers:
            offersFlat.length > 1
              ? {
                  "@type": "AggregateOffer",
                  priceCurrency: currency,
                  lowPrice: typeof minPriceEuro === "number" ? minPriceEuro.toFixed(2) : undefined,
                  highPrice: typeof maxPriceEuro === "number" ? maxPriceEuro.toFixed(2) : undefined,
                  offerCount: offersFlat.length,
                  availability: hasStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                  url: canonicalUrl,
                }
              : {
                  "@type": "Offer",
                  priceCurrency: offersFlat[0].currency,
                  price: ((offersFlat[0].priceCents + (offersFlat[0].shippingCents ?? 0)) / 100).toFixed(2),
                  availability: offersFlat[0].inStock
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                  url: canonicalUrl,
                },
        }
      : {}),
    ...(averageRating != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(averageRating.toFixed(2)),
            reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(reviewJsonLd ? { review: reviewJsonLd } : {}),
  } satisfies Record<string, unknown>;

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: title,
    description: pageDescription,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${site}/#website`,
      url: site,
    },
    breadcrumb: {
      "@id": `${canonicalUrl}#breadcrumb`,
    },
    mainEntity: {
      "@id": `${canonicalUrl}#product`,
    },
    about: [
      {
        "@type": "Thing",
        name: product.category?.name ?? "Produit",
        ...(product.category?.slug ? { url: `${site}/c/${product.category.slug}` } : {}),
      },
      ...((product.Brand?.name ?? product.brand)
        ? [
            {
              "@type": "Brand",
              name: product.Brand?.name ?? product.brand,
              ...(product.Brand?.slug ? { url: `${site}/marques/${product.Brand.slug}` } : {}),
            },
          ]
        : []),
    ],
  };

  const brandUrl = product.Brand?.slug
    ? `/marques/${product.Brand.slug}`
    : product.brand
      ? `/marques/${slugify(product.brand)}`
      : null;

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
      <link rel="canonical" href={canonicalUrl} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />

      <Breadcrumbs
        items={[
          { label: "Accueil", href: "/" },
          {
            label: product.category?.name ?? "Catégorie",
            href: product.category?.slug ? `/c/${product.category.slug}` : undefined,
          },
          { label: title },
        ]}
      />

      <section className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-muted" />
          <p className="mt-2 text-xs text-neutral-500">Photo à venir (marque / feed partenaire).</p>

          <div className="mt-4 space-y-2">
            <Link href={`/me/reviews/new?slug=${encodeURIComponent(product.slug)}`} className="btn">
              ✍️ Je souhaite donner un avis sur ce produit
            </Link>
          </div>
        </div>

        <div className="lg:col-span-7">
          <h1 className="text-2xl font-semibold">{title}</h1>

          <div className="mt-1 text-neutral-600">
            {product.category?.name ?? "—"} ·{" "}
            {brandUrl ? (
              <Link href={brandUrl} className="underline hover:no-underline">
                {product.Brand?.name ?? product.brand}
              </Link>
            ) : (
              product.Brand?.name ?? product.brand ?? "—"
            )}
          </div>

          {averageRating != null && reviewCount > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-neutral-700">
              <StarRating value={averageRating} />
              <span>
                {averageRating.toFixed(1)} / 5 · {reviewCount} avis
              </span>
            </div>
          )}

          <div className="mt-3 rounded-xl border p-4">
            <div className="text-sm text-neutral-500">à partir de</div>
            <div className="text-3xl font-bold">{minPriceCents != null ? money(minPriceCents, "EUR") : "—"}</div>
            <div className="mt-1 text-sm text-neutral-500">chez nos marchands partenaires</div>
          </div>

          {categoryRatings.length > 0 && (
            <section className="mt-4 rounded-xl border p-4 bg-surface/60">
              <h2 className="text-sm font-semibold">Notes des tests</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {categoryRatings.map((cat) => (
                  <li key={cat.id} className="flex items-center justify-between">
                    <span>{cat.label}</span>
                    <span className="flex items-center gap-2">
                      <StarRating value={(cat.avg / 10) * 5} />
                      <span className="text-xs text-neutral-600">{cat.avg.toFixed(1)} / 10</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {specs.map(([k, v]) => (
              <div key={k} className="rounded-xl border p-3">
                <dt className="text-xs uppercase tracking-wide text-neutral-500">{k}</dt>
                <dd className="text-sm">{v}</dd>
              </div>
            ))}
          </dl>

          {desc && (
            <section className="mt-6 rounded-2xl border border-ring bg-surface/60 p-5 shadow-card">
              <h2 className="text-lg font-semibold">Description</h2>
              <div className="max-w-none mt-2 space-y-3 text-sm leading-relaxed text-ink">
                {desc.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para.trim()}</p>
                ))}
              </div>
            </section>
          )}

          {reviewCount > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Avis</h2>
              <ul className="mt-3 space-y-3">
                {product.reviews.map((r) => (
                  <li key={r.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {r.title || "Avis"}
                        <span className="ml-2 inline-flex items-center gap-1 text-sm text-neutral-600">
                          <StarRating value={r.rating} />
                          <span>{r.rating}/5</span>
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500">
                        {r.sourceName ? r.sourceName : r.authorName || "Utilisateur"} · {r.createdAt.toISOString().slice(0, 10)}
                      </div>
                    </div>
                    {r.body ? <p className="mt-2 text-sm text-neutral-700">{r.body}</p> : null}
                    {r.sourceUrl ? (
                      <a
                        href={r.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs underline text-neutral-600"
                      >
                        Voir la source
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tests.length > 0 && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Tests & Essais</h2>
              <ul className="mt-3 space-y-3">
                {tests.map((t) => (
                  <li key={t.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-neutral-500">
                        {t.sourceName} · {t.publishedAt.toISOString().slice(0, 10)}
                      </div>
                    </div>

                    {t.excerpt ? <p className="mt-2 text-sm text-neutral-700">{t.excerpt}</p> : null}

                    {t.ratings && t.ratings.length > 0 && (
                      <div className="mt-3 space-y-1 text-xs text-neutral-700">
                        {t.ratings.map((r, idx) => (
                          <div key={`${r.category.slug}-${idx}`} className="flex items-center justify-between">
                            <span>{r.category.label}</span>
                            <span className="flex items-center gap-2">
                              <StarRating value={(r.score / 10) * 5} />
                              <span>{r.score} / 10</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      {typeof t.score === "number" ? (
                        <span className="inline-flex items-center text-xs text-neutral-700">
                          Note globale : <b className="ml-1">{t.score}</b>
                        </span>
                      ) : (
                        <span />
                      )}
                      {t.sourceUrl ? (
                        <a
                          href={t.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline text-neutral-600"
                        >
                          Lire le test
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-ring bg-surface/60 p-5 shadow-card">
        <h2 className="text-xl font-semibold">Comparer les prix</h2>
        <PriceTable offers={offersFlat} />
      </section>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Produits similaires</h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <li key={r.id} className="rounded-2xl border p-4 hover:shadow-sm transition">
                <Link href={`/p/${r.slug}`} className="block">
                  <div className="aspect-[4/3] w-full rounded-xl bg-muted border" />
                  <div className="mt-2 text-sm font-medium">
                    {[r.brand, r.model, r.season].filter(Boolean).join(" ")}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-xs text-neutral-500">Les prix sont susceptibles d’évoluer. Certains liens sont affiliés.</p>
    </main>
  );
}

function StarRating({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(5, value));
  const full = Math.floor(clamped);
  const half = clamped - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span aria-label={`${value} sur 5`} className="inline-flex items-center text-sec-600">
      {"★".repeat(full)}
      {half ? "☆" : ""}
      {"☆".repeat(empty)}
    </span>
  );
}