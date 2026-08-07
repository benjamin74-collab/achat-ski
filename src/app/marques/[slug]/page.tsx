// src/app/marques/[slug]/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";
import { sanitizeHtml } from "@/lib/sanitize";
import { totalCents } from "@/lib/format";
import ProductCard from "@/components/ProductCard";
import {
  getCurrentSiteUrl,
  getCurrentSiteId,
} from "@/lib/currentSite";
import { getSiteConfig } from "@/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300;

function stripHtml(s: string) {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const siteId = await getCurrentSiteId();
  const siteConfig = getSiteConfig(siteId);
  const site = await getCurrentSiteUrl();

  const brand = await prisma.brand.findUnique({
    where: {
      slug: params.slug,
    },
    select: {
      name: true,
      slug: true,
      description: true,
      metaTitle: true,
      metaDescription: true,
      active: true,
    },
  });

  if (!brand || !brand.active) {
    return {
      title: `Marque introuvable — ${siteConfig.name}`,
    };
  }

  const url = `${site}/marques/${brand.slug}`;

  const title =
    brand.metaTitle ||
    `${brand.name} : produits, prix et comparatif`;

  const description =
    brand.metaDescription ||
    (brand.description
      ? stripHtml(brand.description).slice(0, 160)
      : `Découvre les produits ${brand.name} et compare les prix.`);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BrandPage({
  params,
}: {
  params: { slug: string };
}) {
  const site = await getCurrentSiteUrl();

  const brand = await prisma.brand.findUnique({
    where: {
      slug: params.slug,
    },
    include: {
      logo: {
        select: {
          publicUrl: true,
          alt: true,
        },
      },
      banner: {
        select: {
          publicUrl: true,
          alt: true,
        },
      },
    },
  });

  if (!brand || !brand.active) {
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
          Marque introuvable
        </h1>
      </div>
    );
  }

  const canonicalUrl =
    `${site}/marques/${brand.slug}`;

  const logo =
    brand.logo?.publicUrl ||
    brand.logoUrl ||
    null;

  const banner =
    brand.banner?.publicUrl ||
    null;

  const products =
    await prisma.product.findMany({
      where: {
        OR: [
          {
            brandId: brand.id,
          },
          {
            brand: brand.name,
          },
        ],
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

      take: 60,

      orderBy: {
        id: "desc",
      },
    });

  const productsWithPrice =
    products.map((p) => {
      const allOffers = p.offers;

      const minTotal =
        allOffers.length > 0
          ? allOffers.reduce<number>(
              (min, o) => {
                const t = totalCents(
                  o.priceCents,
                  o.shippingCents ?? 0
                );

                return Math.min(
                  min,
                  t
                );
              },
              Number.POSITIVE_INFINITY
            )
          : null;

      const maxTotal =
        allOffers.length > 0
          ? allOffers.reduce<number>(
              (max, o) => {
                const t = totalCents(
                  o.priceCents,
                  o.shippingCents ?? 0
                );

                return Math.max(
                  max,
                  t
                );
              },
              0
            )
          : null;

      const imageUrl =
        p.imageUrl?.trim() ||
        allOffers.find(
          (offer) =>
            offer.active &&
            offer.imageUrl?.trim()
        )?.imageUrl?.trim() ||
        allOffers.find(
          (offer) =>
            offer.imageUrl?.trim()
        )?.imageUrl?.trim() ||
        undefined;

      return {
        ...p,
        minTotal,
        maxTotal,
        imageUrl,
        offerCount:
          allOffers.length,
      };
    });

  const pageDescription =
    brand.metaDescription ||
    (brand.description
      ? stripHtml(
          brand.description
        ).slice(0, 220)
      : `Découvre les produits ${brand.name}, compare les prix et explore les références disponibles.`);

  const breadcrumbJsonLd = {
    "@context":
      "https://schema.org",
    "@type":
      "BreadcrumbList",
    "@id":
      `${canonicalUrl}#breadcrumb`,

    itemListElement: [
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
        name: "Marques",
        item:
          `${site}/marques`,
      },
      {
        "@type":
          "ListItem",
        position: 3,
        name: brand.name,
        item: canonicalUrl,
      },
    ],
  };

  const brandJsonLd = {
    "@context":
      "https://schema.org",
    "@type":
      "Brand",
    "@id":
      `${canonicalUrl}#brand`,

    name: brand.name,
    url: canonicalUrl,

    ...(logo
      ? {
          logo,
        }
      : {}),

    ...(brand.websiteUrl
      ? {
          sameAs: [
            brand.websiteUrl,
          ],
        }
      : {}),

    ...(pageDescription
      ? {
          description:
            pageDescription,
        }
      : {}),
  };

  const itemListJsonLd = {
    "@context":
      "https://schema.org",
    "@type":
      "ItemList",
    "@id":
      `${canonicalUrl}#itemlist`,

    name:
      `Produits ${brand.name}`,

    itemListOrder:
      "http://schema.org/ItemListUnordered",

    numberOfItems:
      productsWithPrice.length,

    itemListElement:
      productsWithPrice.map(
        (p, index) => {
          const title = [
            p.brand ??
              brand.name,
            p.model,
            p.season,
          ]
            .filter(Boolean)
            .join(" ");

          const url =
            `${site}/p/${p.slug}`;

          const lowPrice =
            typeof p.minTotal ===
              "number" &&
            Number.isFinite(
              p.minTotal
            )
              ? (
                  p.minTotal /
                  100
                ).toFixed(2)
              : undefined;

          const highPrice =
            typeof p.maxTotal ===
              "number" &&
            Number.isFinite(
              p.maxTotal
            )
              ? (
                  p.maxTotal /
                  100
                ).toFixed(2)
              : undefined;

          return {
            "@type":
              "ListItem",
            position:
              index + 1,
            url,

            item: {
              "@type":
                "Product",
              name:
                title,
              url,

              brand: {
                "@type":
                  "Brand",
                name:
                  brand.name,
                url:
                  canonicalUrl,
              },

              ...(p.imageUrl
                ? {
                    image:
                      p.imageUrl,
                  }
                : {}),

              ...(p.category
                ?.name
                ? {
                    category:
                      p.category
                        .name,
                  }
                : {}),

              ...(lowPrice
                ? {
                    offers: {
                      "@type":
                        "AggregateOffer",

                      priceCurrency:
                        "EUR",

                      lowPrice,

                      ...(highPrice
                        ? {
                            highPrice,
                          }
                        : {}),

                      offerCount:
                        p.offerCount,
                    },
                  }
                : {}),
            },
          };
        }
      ),
  };

  const webPageJsonLd = {
    "@context":
      "https://schema.org",
    "@type":
      "WebPage",
    "@id":
      `${canonicalUrl}#webpage`,

    url:
      canonicalUrl,

    name:
      brand.metaTitle ||
      `${brand.name} : produits, prix et comparatif`,

    description:
      pageDescription,

    isPartOf: {
      "@type":
        "WebSite",
      "@id":
        `${site}/#website`,
      url:
        site,
    },

    breadcrumb: {
      "@id":
        `${canonicalUrl}#breadcrumb`,
    },

    mainEntity: {
      "@id":
        `${canonicalUrl}#brand`,
    },

    about: [
      {
        "@type":
          "Brand",
        name:
          brand.name,
        url:
          canonicalUrl,
      },

      ...productsWithPrice
        .slice(0, 12)
        .map((p) => ({
          "@type":
            "Thing",

          name: [
            p.brand ??
              brand.name,
            p.model,
            p.season,
          ]
            .filter(Boolean)
            .join(" "),

          url:
            `${site}/p/${p.slug}`,
        })),
    ],
  };

  const collectionJsonLd = {
    "@context":
      "https://schema.org",
    "@type":
      "CollectionPage",
    "@id":
      `${canonicalUrl}#collection`,

    name:
      `Produits ${brand.name}`,

    description:
      pageDescription,

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
              breadcrumbJsonLd
            ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              brandJsonLd
            ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              webPageJsonLd
            ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              collectionJsonLd
            ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              itemListJsonLd
            ),
        }}
      />

      <Breadcrumbs
        items={[
          {
            href: "/",
            label: "Accueil",
          },
          {
            href: "/marques",
            label: "Marques",
          },
          {
            label:
              brand.name,
          },
        ]}
      />

      {banner && (
        <section className="mt-4 rounded-2xl overflow-hidden border border-ring">
          <img
            src={banner}
            alt={
              brand.banner
                ?.alt ??
              `Bannière ${brand.name}`
            }
            className="w-full h-[220px] object-cover"
          />
        </section>
      )}

      <header className="mt-5 card p-5 flex items-center gap-4">
        {logo && (
          <img
            src={logo}
            alt={
              brand.logo?.alt ??
              `${brand.name} logo`
            }
            width={72}
            height={72}
            className="h-16 w-16 object-contain border border-ring rounded-xl bg-white p-2"
          />
        )}

        <div>
          <h1 className="text-2xl font-bold">
            {brand.name}
          </h1>

          {brand.websiteUrl && (
            <a
              href={
                brand.websiteUrl
              }
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 underline"
            >
              Site officiel
            </a>
          )}
        </div>
      </header>

      {brand.description && (
        <section className="rounded-2xl border border-ring bg-surface/60 p-5 shadow-card my-6">
          <article
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html:
                sanitizeHtml(
                  brand.description
                ),
            }}
          />
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4">
          Produits {brand.name}
        </h2>

        {productsWithPrice.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {productsWithPrice.map(
              (p) => {
                const title = [
                  p.brand ??
                    brand.name,
                  p.model,
                  p.season,
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
					<ProductCard
					  key={p.id}
					  href={`/p/${p.slug}`}
					  title={title}
					  subtitle={p.category?.name}
					  imageUrl={
						p.imageUrl?.trim() ||
						p.offers.find((offer) => offer.imageUrl?.trim())?.imageUrl?.trim() ||
						undefined
					  }
					  offerCount={p.offerCount}
					  minPriceCents={p.minTotal ?? null}
					/>
                );
              }
            )}
          </div>
        ) : (
          <p className="text-neutral-600">
            Aucun produit associé pour le moment.
          </p>
        )}
      </section>
    </div>
  );
}