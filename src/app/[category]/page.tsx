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
import {
  getCurrentSiteUrl,
  getCurrentSiteId,
} from "@/lib/currentSite";
import { getSiteConfig } from "@/config/site";

export const revalidate = 120;

type PageParams = {
  category: string;
};

type SortKey =
  | "newest"
  | "price-asc"
  | "price-desc";

type SearchParams = {
  [key: string]:
    | string
    | string[]
    | undefined;
};

function parsePriceParam(
  value: string | null,
) {
  if (!value) return null;

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return null;
  }

  return Math.round(parsed);
}

function parseSearchParams(
  input?: SearchParams,
) {
  const get = (
    key: string,
  ): string | null => {
    const value = input?.[key];

    return Array.isArray(value)
      ? value[0] ?? null
      : (value ?? null);
  };

  const getAll = (
    key: string,
  ): string[] => {
    const value = input?.[key];

    return Array.isArray(value)
      ? (value.filter(Boolean) as string[])
      : value
        ? [value]
        : [];
  };

  const requestedSort = get(
    "sort",
  ) as SortKey | null;

  const sort: SortKey =
    requestedSort === "price-asc" ||
    requestedSort === "price-desc" ||
    requestedSort === "newest"
      ? requestedSort
      : "newest";

  return {
    page: Math.max(
      1,
      Number(get("page") ?? "1") || 1,
    ),
    sort,
    brands: getAll("brand"),
    minPrice: parsePriceParam(
      get("minPrice"),
    ),
    maxPrice: parsePriceParam(
      get("maxPrice"),
    ),
  };
}

function buildHref(
  baseQuery: {
    page: number;
    sort: SortKey;
    brands: string[];
    minPrice: number | null;
    maxPrice: number | null;
  },
  nextPage: number,
) {
  const params =
    new URLSearchParams();

  if (baseQuery.sort !== "newest") {
    params.set(
      "sort",
      baseQuery.sort,
    );
  }

  for (const brand of baseQuery.brands) {
    params.append(
      "brand",
      brand,
    );
  }

  if (
    typeof baseQuery.minPrice ===
    "number"
  ) {
    params.set(
      "minPrice",
      String(baseQuery.minPrice),
    );
  }

  if (
    typeof baseQuery.maxPrice ===
    "number"
  ) {
    params.set(
      "maxPrice",
      String(baseQuery.maxPrice),
    );
  }

  if (nextPage > 1) {
    params.set(
      "page",
      String(nextPage),
    );
  }

  const query = params.toString();

  return query ? `?${query}` : "?";
}

function stripHtml(
  value: string,
) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPriceRange(
  minCents: number | null,
  maxCents: number | null,
) {
  if (
    typeof minCents !== "number" ||
    typeof maxCents !== "number"
  ) {
    return null;
  }

  return `${(
    minCents / 100
  ).toFixed(0)} € à ${(
    maxCents / 100
  ).toFixed(0)} €`;
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams?: SearchParams;
}) {
  /*
   * IMPORTANT MULTISITE :
   *
   * Toutes les données de la catégorie doivent
   * rester limitées au site courant.
   */
  const site =
    await getCurrentSiteUrl();

  const siteId =
    await getCurrentSiteId();

  const { category } =
    await params;

  const parsed =
    parseSearchParams(
      searchParams,
    );

  const {
    page,
    sort,
    brands,
    minPrice,
    maxPrice,
  } = parsed;

  const cat =
    await prisma.category.findUnique({
      where: {
        slug: category,
      },

      include: {
        parent: {
          select: {
            slug: true,
            name: true,
          },
        },

        children: {
          where: {
            published: true,
            isInMenu: true,
          },

          orderBy: [
            {
              order: "asc",
            },
            {
              name: "asc",
            },
          ],

          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    });

  if (
    !cat ||
    !cat.published
  ) {
    return (
      <div className="container-page py-8">
        <Breadcrumbs
          items={[
            {
              href: "/",
              label: "Accueil",
            },
          ]}
        />

        <h1 className="text-xl font-semibold">
          Catégorie introuvable
        </h1>
      </div>
    );
  }

  const pageSize = 24;

  /*
   * La navigation par catégorie utilise
   * ProductCategory et non uniquement
   * Product.categoryId.
   *
   * Le filtre sites garantit également
   * l'isolation des données entre les
   * différents sites du moteur.
   */
  const baseCategoryWhere: Prisma.ProductWhereInput =
    {
      active: true,
      published: true,

      sites: {
        some: {
          siteId,
          active: true,
          published: true,
        },
      },

      categories: {
        some: {
          categoryId: cat.id,
        },
      },
    };

  /*
   * On récupère tous les produits de la
   * catégorie du SITE COURANT.
   *
   * Les offres sont limitées aux offres
   * actives et en stock.
   *
   * Cela permet :
   * - de calculer le vrai meilleur prix ;
   * - de déterminer les bornes du slider ;
   * - de filtrer sur le même prix que celui
   *   utilisé dans les cartes produits ;
   * - de trier avant pagination.
   */
  const productsRaw =
    await prisma.product.findMany({
      where:
        baseCategoryWhere,

      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },

        offers: {
          where: {
            active: true,
            inStock: true,
          },
        },
      },
    });

  /*
   * Marques disponibles dans la catégorie
   * du site courant.
   */
  const allBrands = Array.from(
    new Set(
      productsRaw
        .map(
          (product) =>
            product.brand,
        )
        .filter(
          (
            brand,
          ): brand is string =>
            typeof brand ===
              "string" &&
            brand.trim().length >
              0,
        )
        .map((brand) =>
          brand.trim(),
        ),
    ),
  ).sort((a, b) =>
    a.localeCompare(
      b,
      "fr",
      {
        sensitivity: "base",
      },
    ),
  );

  /*
   * Calcul des métriques commerciales.
   *
   * minTotal correspond au meilleur prix
   * réellement disponible, frais de port
   * compris.
   */
  const productsWithMetrics =
    productsRaw.map(
      (product) => {
        const availableOffers =
          product.offers;

        const totals =
          availableOffers.map(
            (offer) =>
              totalCents(
                offer.priceCents,
                offer.shippingCents ??
                  0,
              ),
          );

        const minTotal =
          totals.length
            ? Math.min(
                ...totals,
              )
            : null;

        const maxTotal =
          totals.length
            ? Math.max(
                ...totals,
              )
            : null;

        return {
          ...product,
          minTotal,
          maxTotal,
          offerCount:
            availableOffers.length,
        };
      },
    );

  /*
   * Bornes générales du slider.
   *
   * Elles sont calculées sur toute la
   * catégorie du site courant et restent
   * donc stables lorsqu'une marque est
   * sélectionnée.
   */
  const categoryPricedProducts =
    productsWithMetrics.filter(
      (product) =>
        typeof product.minTotal ===
        "number",
    );

  const categoryMinPriceCents =
    categoryPricedProducts.length
      ? Math.min(
          ...categoryPricedProducts.map(
            (product) =>
              product.minTotal as number,
          ),
        )
      : null;

  const categoryMaxPriceCents =
    categoryPricedProducts.length
      ? Math.max(
          ...categoryPricedProducts.map(
            (product) =>
              product.minTotal as number,
          ),
        )
      : null;

  /*
   * Les bornes du slider sont exprimées
   * en euros entiers.
   *
   * floor pour le minimum et ceil pour
   * le maximum garantissent que tous les
   * produits restent accessibles.
   */
  const categoryMinPrice =
    typeof categoryMinPriceCents ===
    "number"
      ? Math.floor(
          categoryMinPriceCents /
            100,
        )
      : null;

  const categoryMaxPrice =
    typeof categoryMaxPriceCents ===
    "number"
      ? Math.ceil(
          categoryMaxPriceCents /
            100,
        )
      : null;

  /*
   * Normalisation des valeurs reçues
   * depuis l'URL.
   */
  let effectiveMinPrice =
    minPrice;

  let effectiveMaxPrice =
    maxPrice;

  if (
    typeof categoryMinPrice ===
      "number" &&
    typeof categoryMaxPrice ===
      "number"
  ) {
    if (
      typeof effectiveMinPrice ===
      "number"
    ) {
      effectiveMinPrice =
        Math.min(
          Math.max(
            effectiveMinPrice,
            categoryMinPrice,
          ),
          categoryMaxPrice,
        );
    }

    if (
      typeof effectiveMaxPrice ===
      "number"
    ) {
      effectiveMaxPrice =
        Math.min(
          Math.max(
            effectiveMaxPrice,
            categoryMinPrice,
          ),
          categoryMaxPrice,
        );
    }

    if (
      typeof effectiveMinPrice ===
        "number" &&
      typeof effectiveMaxPrice ===
        "number" &&
      effectiveMinPrice >
        effectiveMaxPrice
    ) {
      const temporary =
        effectiveMinPrice;

      effectiveMinPrice =
        effectiveMaxPrice;

      effectiveMaxPrice =
        temporary;
    }
  }

  /*
   * Filtrage Marques + Prix.
   *
   * Le filtre prix porte sur minTotal :
   * le meilleur prix actuellement
   * disponible pour le produit.
   */
  const filteredProducts =
    productsWithMetrics.filter(
      (product) => {
        if (
          brands.length > 0
        ) {
          const productBrand =
            product.brand?.trim();

          if (
            !productBrand ||
            !brands.some(
              (brand) =>
                brand.localeCompare(
                  productBrand,
                  undefined,
                  {
                    sensitivity:
                      "base",
                  },
                ) === 0,
            )
          ) {
            return false;
          }
        }

        const priceFilterActive =
          typeof effectiveMinPrice ===
            "number" ||
          typeof effectiveMaxPrice ===
            "number";

        if (
          priceFilterActive
        ) {
          /*
           * Un produit sans offre active
           * n'a pas de prix comparable :
           * il est donc exclu lorsqu'un
           * filtre prix est utilisé.
           */
          if (
            typeof product.minTotal !==
            "number"
          ) {
            return false;
          }

          if (
            typeof effectiveMinPrice ===
              "number" &&
            product.minTotal <
              effectiveMinPrice *
                100
          ) {
            return false;
          }

          if (
            typeof effectiveMaxPrice ===
              "number" &&
            product.minTotal >
              effectiveMaxPrice *
                100
          ) {
            return false;
          }
        }

        return true;
      },
    );

  /*
   * Le total doit correspondre aux
   * filtres réellement appliqués.
   */
  const total =
    filteredProducts.length;

  /*
   * Règle commune à tous les tris :
   *
   * - les produits avec une offre
   *   disponible passent avant ;
   * - les produits sans offre restent
   *   accessibles pour leurs pages SEO ;
   * - le prix utilise le total réel.
   */
  const sortedAll = [
    ...filteredProducts,
  ].sort((a, b) => {
    const aAvailable =
      a.offerCount > 0
        ? 1
        : 0;

    const bAvailable =
      b.offerCount > 0
        ? 1
        : 0;

    if (
      aAvailable !==
      bAvailable
    ) {
      return (
        bAvailable -
        aAvailable
      );
    }

    if (
      sort ===
      "price-asc"
    ) {
      if (
        a.minTotal !== null &&
        b.minTotal !== null &&
        a.minTotal !==
          b.minTotal
      ) {
        return (
          a.minTotal -
          b.minTotal
        );
      }
    } else if (
      sort ===
      "price-desc"
    ) {
      if (
        a.maxTotal !== null &&
        b.maxTotal !== null &&
        a.maxTotal !==
          b.maxTotal
      ) {
        return (
          b.maxTotal -
          a.maxTotal
        );
      }
    } else {
      if (
        a.offerCount !==
        b.offerCount
      ) {
        return (
          b.offerCount -
          a.offerCount
        );
      }
    }

    return b.id - a.id;
  });

  const pages = Math.max(
    1,
    Math.ceil(
      total / pageSize,
    ),
  );

  /*
   * On évite une pagination hors limite
   * lorsqu'un filtre réduit fortement le
   * nombre de résultats.
   */
  const safePage =
    Math.min(
      page,
      pages,
    );

  const skip =
    (safePage - 1) *
    pageSize;

  /*
   * Pagination APRÈS classement global.
   */
  const sorted =
    sortedAll.slice(
      skip,
      skip + pageSize,
    );

  const safeHtml =
    cat.content
      ? sanitizeHtml(
          cat.content,
        )
      : "";

  const canonicalUrl =
    `${site}/${cat.slug}`;

  /*
   * Plage de prix affichée dans l'en-tête.
   *
   * Contrairement à l'ancienne version,
   * elle est calculée sur l'ensemble des
   * résultats filtrés et non uniquement
   * sur les 24 produits de la page.
   */
  const filteredPricedProducts =
    filteredProducts.filter(
      (product) =>
        typeof product.minTotal ===
        "number",
    );

  const globalMinPrice =
    filteredPricedProducts.length
      ? Math.min(
          ...filteredPricedProducts.map(
            (product) =>
              product.minTotal as number,
          ),
        )
      : null;

  const globalMaxPrice =
    filteredPricedProducts.length
      ? Math.max(
          ...filteredPricedProducts.map(
            (product) =>
              product.maxTotal as number,
          ),
        )
      : null;

  const introText =
    cat.intro?.trim() ||
    `Compare les meilleurs produits de la catégorie ${cat.name}, consulte les prix disponibles et découvre les références proposées par les marchands partenaires.`;

  const breadcrumbItems = [
    {
      "@type":
        "ListItem",
      position: 1,
      name: "Accueil",
      item: `${site}/`,
    },

    {
      "@type":
        "ListItem",
      position: 2,
      name: "Catégories",
      item: `${site}/#categories`,
    },

    ...(cat.parent
      ? [
          {
            "@type":
              "ListItem",
            position: 3,
            name:
              cat.parent.name,
            item: `${site}/${cat.parent.slug}`,
          },

          {
            "@type":
              "ListItem",
            position: 4,
            name: cat.name,
            item:
              canonicalUrl,
          },
        ]
      : [
          {
            "@type":
              "ListItem",
            position: 3,
            name: cat.name,
            item:
              canonicalUrl,
          },
        ]),
  ];

  const breadcrumbJsonLd =
    {
      "@context":
        "https://schema.org",
      "@type":
        "BreadcrumbList",
      "@id":
        `${canonicalUrl}#breadcrumb`,
      itemListElement:
        breadcrumbItems,
    };

  const itemListJsonLd =
    {
      "@context":
        "https://schema.org",

      "@type":
        "ItemList",

      "@id":
        `${canonicalUrl}#itemlist`,

      name:
        `Produits — ${cat.name}`,

      itemListOrder:
        sort ===
        "price-asc"
          ? "http://schema.org/ItemListOrderAscending"
          : sort ===
              "price-desc"
            ? "http://schema.org/ItemListOrderDescending"
            : "http://schema.org/ItemListUnordered",

      numberOfItems:
        sorted.length,

      itemListElement:
        sorted.map(
          (
            product,
            index,
          ) => {
            const title = [
              product.brand,
              product.model,
              product.season,
            ]
              .filter(Boolean)
              .join(" ");

            const url =
              `${site}/p/${product.slug}`;

            return {
              "@type":
                "ListItem",

              /*
               * Position réelle dans
               * l'ensemble paginé.
               */
              position:
                skip +
                index +
                1,

              item: {
                "@type":
                  "WebPage",
                "@id": url,
                url,
                name: title,
              },
            };
          },
        ),
    };

  const webPageJsonLd =
    {
      "@context":
        "https://schema.org",

      "@type":
        "WebPage",

      "@id":
        `${canonicalUrl}#webpage`,

      url:
        canonicalUrl,

      name:
        cat.metaTitle ??
        cat.name,

      description:
        cat.metaDescription ??
        introText,

      isPartOf: {
        "@type":
          "WebSite",
        "@id":
          `${site}/#website`,
        url: site,
      },

      breadcrumb: {
        "@id":
          `${canonicalUrl}#breadcrumb`,
      },

      mainEntity: {
        "@id":
          `${canonicalUrl}#collection`,
      },

      about: [
        {
          "@type":
            "Thing",
          name:
            cat.name,
          url:
            canonicalUrl,
        },

        ...cat.children.map(
          (subcategory) => ({
            "@type":
              "Thing",
            name:
              subcategory.name,
            url:
              `${site}/${subcategory.slug}`,
          }),
        ),
      ],
    };

  const collectionJsonLd =
    {
      "@context":
        "https://schema.org",

      "@type":
        "CollectionPage",

      "@id":
        `${canonicalUrl}#collection`,

      name:
        cat.name,

      description:
        cat.metaDescription ??
        cat.intro ??
        `Comparatif et prix pour ${cat.name}.`,

      url:
        canonicalUrl,

      isPartOf: {
        "@type":
          "WebSite",
        "@id":
          `${site}/#website`,
      },

      breadcrumb: {
        "@id":
          `${canonicalUrl}#breadcrumb`,
      },

      mainEntity: {
        "@id":
          `${canonicalUrl}#itemlist`,
      },
    };

  return (
    <div className="container-page py-8">
      <link
        rel="canonical"
        href={canonicalUrl}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              breadcrumbJsonLd,
            ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              webPageJsonLd,
            ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              collectionJsonLd,
            ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              itemListJsonLd,
            ),
        }}
      />

      <div className="flex flex-col gap-6 md:grid md:grid-cols-12">
        <aside className="md:col-span-3">
          <div className="md:sticky md:top-24">
            <FiltersBar
              brands={
                allBrands
              }
              minPrice={
                categoryMinPrice
              }
              maxPrice={
                categoryMaxPrice
              }
            />
          </div>
        </aside>

        <div className="md:col-span-9 flex flex-col gap-6">
          <Breadcrumbs
            items={[
              {
                href: "/",
                label:
                  "Accueil",
              },

              {
                label:
                  "Catégories",
                href:
                  "/#categories",
              },

              ...(cat.parent
                ? [
                    {
                      label:
                        cat
                          .parent
                          .name,
                      href:
                        `/${cat.parent.slug}`,
                    },
                  ]
                : []),

              {
                label:
                  cat.name,
              },
            ]}
          />

          <header className="rounded-3xl border border-ring bg-white p-5 md:p-7 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-ring bg-muted/40 px-3 py-1 text-xs font-medium text-slate-700">
                Catégorie
              </span>

              <span className="inline-flex rounded-full border border-ring bg-muted/40 px-3 py-1 text-xs font-medium text-slate-700">
                {total} résultat
                {total > 1
                  ? "s"
                  : ""}
              </span>

              {cat.children
                .length >
              0 ? (
                <span className="inline-flex rounded-full border border-ring bg-muted/40 px-3 py-1 text-xs font-medium text-slate-700">
                  {
                    cat
                      .children
                      .length
                  }{" "}
                  sous-catégorie
                  {cat
                    .children
                    .length >
                  1
                    ? "s"
                    : ""}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900">
                  {
                    cat.name
                  }
                </h1>

                <p className="mt-3 max-w-3xl text-sm md:text-base leading-relaxed text-slate-700">
                  {
                    introText
                  }
                </p>
              </div>

              <div className="w-full lg:w-auto">
                <SortSelect />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-ring bg-muted/20 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Produits
                </div>

                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {total}
                </div>
              </div>

              <div className="rounded-2xl border border-ring bg-muted/20 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Marques
                </div>

                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {allBrands.length ||
                    "—"}
                </div>
              </div>

              <div className="rounded-2xl border border-ring bg-muted/20 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Plage de prix
                </div>

                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {formatPriceRange(
                    globalMinPrice,
                    globalMaxPrice,
                  ) ??
                    "Non disponible"}
                </div>
              </div>
            </div>
          </header>

          <section
            id="produits"
            className="space-y-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
                  Produits{" "}
                  {
                    cat.name
                  }
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Compare les
                  références
                  actuellement
                  disponibles dans
                  cette catégorie.
                </p>
              </div>

              <div className="text-sm text-slate-500">
                Page{" "}
                {safePage} /{" "}
                {pages}
              </div>
            </div>

            {sorted.length >
            0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {sorted.map(
                  (
                    product,
                  ) => {
                    const cardTitle =
                      [
                        product.brand,
                        product.model,
                        product.season,
                      ]
                        .filter(
                          Boolean,
                        )
                        .join(
                          " ",
                        );

                    return (
                      <ProductCard
                        key={
                          product.id
                        }
                        href={`/p/${product.slug}`}
                        title={
                          cardTitle
                        }
                        subtitle={
                          product
                            .category
                            ?.name ??
                          undefined
                        }
                        imageUrl={
                          product.imageUrl?.trim() ||
                          product.offers
                            .find(
                              (
                                offer,
                              ) =>
                                offer.imageUrl?.trim(),
                            )
                            ?.imageUrl?.trim() ||
                          undefined
                        }
                        offerCount={
                          product.offerCount
                        }
                        minPriceCents={
                          product.minTotal ??
                          null
                        }
                      />
                    );
                  },
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-ring bg-white p-5 text-sm text-slate-600 shadow-card">
                Aucun produit ne
                correspond aux
                filtres
                sélectionnés.
              </div>
            )}
          </section>

          {pages > 1 && (
            <nav className="flex items-center gap-2">
              <Link
                className={`btn ${
                  safePage <=
                  1
                    ? "pointer-events-none opacity-50"
                    : ""
                }`}
                href={buildHref(
                  {
                    ...parsed,
                    page:
                      safePage,
                    minPrice:
                      effectiveMinPrice,
                    maxPrice:
                      effectiveMaxPrice,
                  },
                  safePage -
                    1,
                )}
                aria-disabled={
                  safePage <=
                  1
                }
              >
                ← Précédent
              </Link>

              <span className="text-sm text-neutral-600">
                Page{" "}
                {safePage} /{" "}
                {pages}
              </span>

              <Link
                className={`btn ${
                  safePage >=
                  pages
                    ? "pointer-events-none opacity-50"
                    : ""
                }`}
                href={buildHref(
                  {
                    ...parsed,
                    page:
                      safePage,
                    minPrice:
                      effectiveMinPrice,
                    maxPrice:
                      effectiveMaxPrice,
                  },
                  safePage +
                    1,
                )}
                aria-disabled={
                  safePage >=
                  pages
                }
              >
                Suivant →
              </Link>
            </nav>
          )}

          {cat.children
            .length >
            0 && (
            <section className="rounded-3xl border border-ring bg-white p-5 md:p-6 shadow-card">
              <h2 className="text-xl font-semibold text-slate-900">
                Sous-catégories
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Explore les
                sous-catégories
                liées à{" "}
                {cat.name} pour
                affiner ta
                recherche.
              </p>

              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {cat.children.map(
                  (
                    subcategory,
                  ) => (
                    <li
                      key={
                        subcategory.id
                      }
                    >
                      <Link
                        href={`/${subcategory.slug}`}
                        className="block rounded-2xl border border-ring bg-muted/20 px-4 py-4 font-medium text-slate-900 transition hover:bg-muted/40"
                      >
                        {
                          subcategory.name
                        }
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </section>
          )}

          {safeHtml && (
            <section className="rounded-3xl border border-ring bg-surface/60 p-5 md:p-6 shadow-card">
              <article
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{
                  __html:
                    safeHtml,
                }}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { category } =
    await params;

  const siteId =
    await getCurrentSiteId();

  const siteConfig =
    getSiteConfig(siteId);

  const site =
    await getCurrentSiteUrl();

  const cat =
    await prisma.category.findUnique({
      where: {
        slug: category,
      },

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

  if (
    !cat ||
    !cat.published
  ) {
    return {
      title:
        `Catégorie introuvable — ${siteConfig.name}`,

      description:
        "Cette catégorie n'existe pas ou n'est pas publiée.",
    };
  }

  const url =
    `${site}/${cat.slug}`;

  const fallbackDescription =
    cat.metaDescription ||
    cat.intro ||
    (cat.content
      ? stripHtml(
          cat.content,
        ).slice(
          0,
          160,
        )
      : `Guide d'achat et comparatif ${cat.name}.`);

  const metaTitle =
    cat.metaTitle ||
    `${cat.name} : comparatif, prix et guide d’achat`;

  return {
    title:
      metaTitle,

    description:
      fallbackDescription,

    alternates: {
      canonical:
        url,
    },

    openGraph: {
      title:
        metaTitle,

      description:
        fallbackDescription,

      url,
    },
  };
}