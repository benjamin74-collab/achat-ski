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
import { getCurrentSiteUrl } from "@/lib/currentSite";

export const runtime = "nodejs";
export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getCurrentSiteUrl();

  const p = await prisma.product.findUnique({
    where: { slug },
    select: {
      brand: true,
      model: true,
      season: true,
      slug: true,
      description: true,
      category: {
        select: {
          name: true,
        },
      },
      Brand: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!p) {
    return {
      title: "Produit introuvable",
    };
  }

  const name = [
    p.Brand?.name ?? p.brand,
    p.model,
    p.season,
  ]
    .filter(Boolean)
    .join(" ");

  const url = `${site}/p/${p.slug}`;

  const desc =
    p.description?.trim() ||
    `Comparez les prix de ${name}, consultez les offres disponibles et trouvez le meilleur marchand partenaire.`;

  return {
    title: `${name} — Comparatif prix et offres`,
    description: desc,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${name} — Comparatif prix et offres`,
      description: desc,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — Comparatif prix et offres`,
      description: desc,
    },
  };
}

function jsonToSpecs(
  input: Prisma.JsonValue | null | undefined
): Array<[string, string]> {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    return [];
  }

  return Object.entries(input)
    .filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        typeof value !== "object"
    )
    .map(([key, value]) => [
      key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase())
        .trim(),
      String(value),
    ]);
}

export default async function ProductPage({
  params,
}: PageProps) {
  const site = await getCurrentSiteUrl();
  const { slug } = await params;

  const product =
    await prisma.product.findUnique({
      where: {
        slug,
      },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        Brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: {
              select: {
                publicUrl: true,
                alt: true,
              },
            },
            logoUrl: true,
          },
        },
        skus: {
          select: {
            id: true,
            variant: true,
            gtin: true,
            attributes: true,
          },
        },
        offers: {
          select: {
            id: true,
            productId: true,
            merchantId: true,
            priceCents: true,
            shippingCents: true,
            currency: true,
            affiliateUrl: true,
            imageUrl: true,
            inStock: true,
            availability: true,
            active: true,
            merchant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        tests: {
          where: {
            status: "APPROVED",
          },
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
          orderBy: {
            publishedAt: "desc",
          },
          take: 10,
        },
      },
    });

  if (!product) {
    return notFound();
  }

  const offersFlat = product.offers.map(
    (offer) => ({
      id: offer.id,
      productId: product.id,
      merchantName: offer.merchant.name,
      merchantSlug: offer.merchant.slug,
      priceCents: offer.priceCents,
      shippingCents: offer.shippingCents,
      currency: offer.currency,
      affiliateUrl: offer.affiliateUrl,
      inStock: offer.inStock,
      availability: offer.availability,
    })
  );

  const title = [
    product.Brand?.name ?? product.brand,
    product.model,
    product.season,
  ]
    .filter(Boolean)
    .join(" ");

  const inStockOffers = offersFlat.filter(
    (offer) => offer.inStock
  );

  const sortedOffers = [...offersFlat].sort(
    (a, b) =>
      a.priceCents +
      (a.shippingCents ?? 0) -
      (b.priceCents +
        (b.shippingCents ?? 0))
  );

  const bestOffer = inStockOffers.length
    ? [...inStockOffers].sort(
        (a, b) =>
          a.priceCents +
          (a.shippingCents ?? 0) -
          (b.priceCents +
            (b.shippingCents ?? 0))
      )[0]
    : sortedOffers[0];

  const minPriceCents = bestOffer
    ? bestOffer.priceCents +
      (bestOffer.shippingCents ?? 0)
    : null;

  const hasStock = inStockOffers.length > 0;

  const brandName =
    product.Brand?.name ??
    product.brand ??
    "—";

  const productImageUrl =
    product.imageUrl?.trim() ||
    product.offers.find((offer) =>
      offer.imageUrl?.trim()
    )?.imageUrl ||
    null;

  const brandUrl = product.Brand?.slug
    ? `/marques/${product.Brand.slug}`
    : product.brand
      ? `/marques/${slugify(product.brand)}`
      : null;

  const canonicalUrl = `${site}/p/${product.slug}`;

  const desc =
    product.description?.trim() ?? null;

  const pageDescription =
    desc ||
    `Comparez les prix de ${title}, consultez les offres disponibles et trouvez le meilleur marchand partenaire.`;

  const baseSpecs: Array<
    [string, string]
  > = [
    ["Marque", brandName],
    ["Modèle", product.model ?? "—"],
    ["Saison", product.season ?? "—"],
    [
      "Catégorie",
      product.category?.name ?? "—",
    ],
  ];

  const attributeSpecs = jsonToSpecs(
    product.attributes as
      | Prisma.JsonValue
      | null
  );

  const skuSpecs = product.skus[0]
    ?.attributes
    ? jsonToSpecs(
        product.skus[0]
          .attributes as Prisma.JsonValue
      )
    : [];

  const specs = [
    ...baseSpecs,
    ...attributeSpecs,
    ...skuSpecs,
  ];

  const brandWhere: Prisma.ProductWhereInput =
    typeof product.Brand?.id ===
    "number"
      ? {
          brandId: product.Brand.id,
        }
      : product.brand
        ? {
            brand: product.brand,
          }
        : {};

  const related =
    await prisma.product.findMany({
      where: {
        id: {
          not: product.id,
        },
        ...brandWhere,
        ...(product.category?.slug
          ? {
              category: {
                is: {
                  slug: product.category
                    .slug,
                },
              },
            }
          : {}),
      },
      take: 6,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        offers: true,
      },
    });

  type CategoryAgg = {
    id: number;
    slug: string;
    label: string;
    order: number;
    sum: number;
    count: number;
  };

  const categoryMap = new Map<
    number,
    CategoryAgg
  >();

  for (const test of product.tests) {
    for (const rating of
      test.ratings ?? []) {
      const category = rating.category;

      if (!category) {
        continue;
      }

      const existing =
        categoryMap.get(category.id) ?? {
          id: category.id,
          slug: category.slug,
          label: category.label,
          order: category.order ?? 0,
          sum: 0,
          count: 0,
        };

      existing.sum += rating.score;
      existing.count += 1;

      categoryMap.set(
        category.id,
        existing
      );
    }
  }

  const categoryRatings = Array.from(
    categoryMap.values()
  )
    .map((category) => ({
      ...category,
      avg:
        category.count > 0
          ? category.sum /
            category.count
          : 0,
    }))
    .sort(
      (a, b) =>
        a.order - b.order ||
        a.label.localeCompare(b.label)
    );

  const currency =
    bestOffer?.currency ?? "EUR";

  const minPriceEuro = bestOffer
    ? (bestOffer.priceCents +
        (bestOffer.shippingCents ??
          0)) /
      100
    : undefined;

  const maxPriceEuro =
    offersFlat.length > 0
      ? Math.max(
          ...offersFlat.map(
            (offer) =>
              (offer.priceCents +
                (offer.shippingCents ??
                  0)) /
              100
          )
        )
      : undefined;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: `${site}/`,
      },
      ...(product.category?.name &&
      product.category?.slug
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: product.category.name,
              item: `${site}/${product.category.slug}`,
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
    image: productImageUrl ?? undefined,
    brand: brandName
      ? {
          "@type": "Brand",
          name: brandName,
          ...(product.Brand?.slug
            ? {
                url: `${site}/marques/${product.Brand.slug}`,
              }
            : {}),
        }
      : undefined,
    sku:
      product.skus?.[0]?.variant ??
      undefined,
    ...(product.skus?.[0]?.gtin &&
    /^\d{13}$/.test(
      product.skus[0].gtin
    )
      ? {
          gtin13:
            product.skus[0].gtin,
        }
      : {}),
    category:
      product.category?.name ??
      undefined,
    ...(offersFlat.length > 0
      ? {
          offers:
            offersFlat.length > 1
              ? {
                  "@type":
                    "AggregateOffer",
                  priceCurrency:
                    currency,
                  lowPrice:
                    typeof minPriceEuro ===
                    "number"
                      ? minPriceEuro.toFixed(
                          2
                        )
                      : undefined,
                  highPrice:
                    typeof maxPriceEuro ===
                    "number"
                      ? maxPriceEuro.toFixed(
                          2
                        )
                      : undefined,
                  offerCount:
                    offersFlat.length,
                  availability: hasStock
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                  url: canonicalUrl,
                }
              : {
                  "@type": "Offer",
                  priceCurrency:
                    offersFlat[0]
                      .currency,
                  price: (
                    (offersFlat[0]
                      .priceCents +
                      (offersFlat[0]
                        .shippingCents ??
                        0)) /
                    100
                  ).toFixed(2),
                  availability:
                    offersFlat[0]
                      .inStock
                      ? "https://schema.org/InStock"
                      : "https://schema.org/OutOfStock",
                  url: canonicalUrl,
                },
        }
      : {}),
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
  };

  return (
    <main className="bg-slate-50/70 pb-12">
      <link
        rel="canonical"
        href={canonicalUrl}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageJsonLd
          ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            productJsonLd
          ),
        }}
      />

      <div className="mx-auto max-w-6xl px-4 pt-5">
        <Breadcrumbs
          items={[
            {
              label: "Accueil",
              href: "/",
            },
            {
              label:
                product.category
                  ?.name ?? "Catégorie",
              href: product.category
                ?.slug
                ? `/${product.category.slug}`
                : undefined,
            },
            {
              label: title,
            },
          ]}
        />

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="bg-slate-100 lg:col-span-5">
              <div className="flex min-h-[360px] items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,.16),transparent_35%),linear-gradient(135deg,#f8fafc,#e2e8f0)] p-8">
                {productImageUrl ? (
                  <img
                    src={productImageUrl}
                    alt={title}
                    className="max-h-[440px] w-full object-contain"
                    loading="eager"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white/80 text-3xl font-black text-brand-700 shadow-sm ring-1 ring-slate-200">
                      {brandName
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <p className="mt-4 text-sm font-semibold text-slate-500">
                      Photo produit à venir
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Image importée via le
                      feed marchand
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 md:p-8 lg:col-span-7 lg:p-10">
              <div className="flex flex-wrap items-center gap-2">
                {product.category
                  ?.name ? (
                  <Link
                    href={
                      product.category
                        .slug
                        ? `/${product.category.slug}`
                        : "#"
                    }
                    className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-200"
                  >
                    {
                      product.category
                        .name
                    }
                  </Link>
                ) : null}

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                    hasStock
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-slate-100 text-slate-500 ring-slate-200"
                  }`}
                >
                  {hasStock
                    ? "En stock"
                    : "Stock à vérifier"}
                </span>

                {offersFlat.length >
                0 ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    {offersFlat.length}{" "}
                    offre
                    {offersFlat.length >
                    1
                      ? "s"
                      : ""}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl">
                {title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>
                  {product.category
                    ?.name ??
                    "Catégorie non définie"}
                </span>

                <span className="text-slate-300">
                  ·
                </span>

                {brandUrl ? (
                  <Link
                    href={brandUrl}
                    className="font-semibold text-brand-700 hover:text-brand-800"
                  >
                    {brandName}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-800">
                    {brandName}
                  </span>
                )}
              </div>

              <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Meilleur prix trouvé
                  </p>

                  <div className="mt-2 text-4xl font-black text-slate-950">
                    {minPriceCents !=
                    null
                      ? money(
                          minPriceCents,
                          currency
                        )
                      : "—"}
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    prix total estimé
                    avec livraison
                  </p>
                </div>

                {bestOffer ? (
                  <Link
                    href={`/api/go/${bestOffer.merchantSlug}/${bestOffer.id}`}
                    target="_blank"
                    rel="nofollow sponsored noopener"
                    prefetch={false}
                    className="inline-flex min-h-[56px] items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-brand-700"
                  >
                    Voir la meilleure
                    offre
                  </Link>
                ) : null}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Marque
                  </div>

                  <div className="mt-1 font-bold text-slate-950">
                    {brandName}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Saison
                  </div>

                  <div className="mt-1 font-bold text-slate-950">
                    {product.season ??
                      "—"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Marchands
                  </div>

                  <div className="mt-1 font-bold text-slate-950">
                    {offersFlat.length ||
                      "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="prix"
          className="mt-8"
        >
          <PriceTable
            offers={offersFlat}
          />
        </section>

        <div className="mt-8 grid grid-cols-1 gap-7 lg:grid-cols-12">
          <section className="lg:col-span-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                Présentation
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                À propos du{" "}
                {product.model}
              </h2>

              {desc ? (
                <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700 md:text-base md:leading-8">
                  {desc
                    .split(/\n{2,}/)
                    .map(
                      (
                        paragraph,
                        index
                      ) => (
                        <p key={index}>
                          {paragraph.trim()}
                        </p>
                      )
                    )}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Cette fiche produit
                  sera enrichie
                  automatiquement avec
                  les informations issues
                  des flux marchands et
                  des contenus
                  éditoriaux.
                </p>
              )}
            </div>

            {product.tests.length >
            0 ? (
              <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                  Tests
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                  Tests & avis experts
                </h2>

                <ul className="mt-5 space-y-4">
                  {product.tests.map(
                    (test) => (
                      <li
                        key={test.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-black text-slate-950">
                              {
                                test.title
                              }
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                test.sourceName
                              }{" "}
                              ·{" "}
                              {test.publishedAt
                                .toISOString()
                                .slice(
                                  0,
                                  10
                                )}
                            </p>
                          </div>

                          {typeof test.score ===
                          "number" ? (
                            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700 ring-1 ring-brand-200">
                              {
                                test.score
                              }
                              /10
                            </span>
                          ) : null}
                        </div>

                        {test.excerpt ? (
                          <p className="mt-3 text-sm leading-6 text-slate-700">
                            {
                              test.excerpt
                            }
                          </p>
                        ) : null}

                        {test.ratings &&
                        test.ratings
                          .length > 0 ? (
                          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {test.ratings.map(
                              (
                                rating,
                                index
                              ) => (
                                <div
                                  key={`${rating.category.slug}-${index}`}
                                  className="rounded-2xl bg-white p-3 ring-1 ring-slate-200"
                                >
                                  <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="font-semibold text-slate-700">
                                      {
                                        rating
                                          .category
                                          .label
                                      }
                                    </span>

                                    <span className="font-black text-slate-950">
                                      {
                                        rating.score
                                      }
                                      /10
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : null}

                        {test.sourceUrl ? (
                          <a
                            href={
                              test.sourceUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800"
                          >
                            Lire le test
                            complet →
                          </a>
                        ) : null}
                      </li>
                    )
                  )}
                </ul>
              </section>
            ) : null}
          </section>

          <aside className="space-y-5 lg:col-span-4">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                Fiche technique
              </p>

              <h2 className="mt-1 text-lg font-black text-slate-950">
                Caractéristiques
              </h2>

              <dl className="mt-4 space-y-2">
                {specs.map(
                  ([key, value]) => (
                    <div
                      key={`${key}-${value}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3"
                    >
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {key}
                      </dt>

                      <dd className="mt-1 text-sm font-bold text-slate-950">
                        {value}
                      </dd>
                    </div>
                  )
                )}
              </dl>
            </div>

            {categoryRatings.length >
            0 ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                  Notes
                </p>

                <h2 className="mt-1 text-lg font-black text-slate-950">
                  Synthèse des tests
                </h2>

                <ul className="mt-4 space-y-3">
                  {categoryRatings.map(
                    (category) => (
                      <li
                        key={category.id}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-700">
                            {
                              category.label
                            }
                          </span>

                          <span className="font-black text-slate-950">
                            {category.avg.toFixed(
                              1
                            )}
                            /10
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(
                                  100,
                                  category.avg *
                                    10
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </li>
                    )
                  )}
                </ul>
              </div>
            ) : null}

            <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                Conseil
              </p>

              <h2 className="mt-1 text-lg font-black">
                Comparer avant
                d’acheter
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/70">
                Les prix peuvent varier
                selon la taille, le
                stock, la livraison et
                les promotions
                marchands. Pensez à
                vérifier le total avant
                achat.
              </p>
            </div>
          </aside>
        </div>

        {related.length > 0 ? (
          <section className="mt-10">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                Alternatives
              </p>

              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                Produits similaires
              </h2>
            </div>

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map(
                (relatedProduct) => {
                  const allOffers =
                    relatedProduct.offers;

                  const minTotal =
                    allOffers.length > 0
                      ? allOffers.reduce<number>(
                          (
                            minimum,
                            offer
                          ) =>
                            Math.min(
                              minimum,
                              offer.priceCents +
                                (offer.shippingCents ??
                                  0)
                            ),
                          Number.POSITIVE_INFINITY
                        )
                      : null;

                  const relatedTitle = [
                    relatedProduct.brand,
                    relatedProduct.model,
                    relatedProduct.season,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <li
                      key={
                        relatedProduct.id
                      }
                      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-card"
                    >
                      <Link
                        href={`/p/${relatedProduct.slug}`}
                        className="block"
                      >
                        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-100">
						  {relatedProduct.imageUrl ? (
							<img
							  src={relatedProduct.imageUrl}
							  alt={relatedTitle}
							  className="h-full w-full object-contain"
							  loading="lazy"
							  referrerPolicy="no-referrer"
							/>
						  ) : (
							<span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
							  Photo à venir
							</span>
						  )}
						</div>

                        <div className="p-4">
                          <h3 className="text-sm font-black leading-snug text-slate-950 group-hover:text-brand-700">
                            {
                              relatedTitle
                            }
                          </h3>

                          {relatedProduct
                            .category
                            ?.name ? (
                            <p className="mt-1 text-xs text-slate-500">
                              {
                                relatedProduct
                                  .category
                                  .name
                              }
                            </p>
                          ) : null}

                          <div className="mt-3 flex items-end justify-between gap-3">
                            <span className="text-xs text-slate-500">
                              à partir de
                            </span>

                            <span className="text-lg font-black text-sec-600">
                              {minTotal !=
                                null &&
                              Number.isFinite(
                                minTotal
                              )
                                ? money(
                                    minTotal,
                                    "EUR"
                                  )
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                }
              )}
            </ul>
          </section>
        ) : null}

        <p className="mt-8 text-xs text-slate-500">
          Les prix sont susceptibles
          d’évoluer. Certains liens sont
          affiliés. Meilleur-Ski peut
          percevoir une commission si
          vous achetez via un lien
          partenaire.
        </p>
      </div>
    </main>
  );
}