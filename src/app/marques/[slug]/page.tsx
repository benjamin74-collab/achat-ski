// src/app/marques/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";
import { sanitizeHtml } from "@/lib/sanitize";
import { totalCents } from "@/lib/format";
import ProductCard from "@/components/ProductCard";

export const revalidate = 300;

function getSiteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/+$/, "");
  return "https://meilleur-ski.com";
}

function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateStaticParams() {
  const brands = await prisma.brand.findMany({
    where: { active: true },
    select: { slug: true },
  });
  return brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const brand = await prisma.brand.findUnique({
    where: { slug: params.slug },
    select: {
      name: true,
      slug: true,
      description: true,
      metaTitle: true,
      metaDescription: true,
    },
  });

  if (!brand) return { title: "Marque introuvable — Meilleur-Ski" };

  const site = getSiteUrl();
  const url = `${site}/marques/${brand.slug}`;

  const title = (brand.metaTitle && brand.metaTitle.trim()) || `${brand.name} — Tests, prix et produits`;
  const description =
    (brand.metaDescription && brand.metaDescription.trim()) ||
    (brand.description ? stripHtml(brand.description).slice(0, 160) : `Produits ${brand.name} : tests, prix, comparatifs.`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, url, description },
  };
}

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const site = getSiteUrl();

  const brand = await prisma.brand.findUnique({
    where: { slug: params.slug },
    include: {
      logo: { select: { publicUrl: true, alt: true } },
      banner: { select: { publicUrl: true, alt: true } },
    },
  });

  if (!brand || !brand.active) {
    return (
      <div className="container-page py-8">
        <Breadcrumbs items={[{ href: "/", label: "Accueil" }, { href: "/marques", label: "Marques" }]} />
        <h1 className="text-xl font-semibold">Marque introuvable</h1>
      </div>
    );
  }

  const canonicalUrl = `${site}/marques/${brand.slug}`;

  const logo = brand.logo?.publicUrl || brand.logoUrl || null;
  const banner = brand.banner?.publicUrl || (brand as any).bannerUrl || null;

  const products = await prisma.product.findMany({
    where: {
      OR: [{ brandId: brand.id }, { brand: brand.name }],
    },
    include: { category: { select: { name: true } }, skus: { include: { offers: true } } },
    take: 60,
    orderBy: { id: "desc" },
  });

  const productsWithPrice = products.map((p) => {
    const allOffers = p.skus.flatMap((s) => s.offers);
    const minTotal = allOffers.length
      ? allOffers
          .map((o) => totalCents(o.priceCents, o.shippingCents ?? 0))
          .reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY)
      : null;
    return { ...p, minTotal };
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${site}/` },
      { "@type": "ListItem", position: 2, name: "Marques", item: `${site}/marques` },
      { "@type": "ListItem", position: 3, name: brand.name, item: canonicalUrl },
    ],
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: canonicalUrl,
    ...(logo ? { logo } : {}),
    ...(brand.websiteUrl ? { sameAs: [brand.websiteUrl] } : {}),
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Produits ${brand.name}`,
    numberOfItems: productsWithPrice.length,
    itemListElement: productsWithPrice.map((p, idx) => {
      const title = [p.brand ?? brand.name, p.model, p.season].filter(Boolean).join(" ");
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

  return (
    <div className="container-page py-8">
      <link rel="canonical" href={canonicalUrl} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      <Breadcrumbs items={[{ href: "/", label: "Accueil" }, { href: "/marques", label: "Marques" }, { label: brand.name }]} />

      {/* Bannière */}
      {banner ? (
        <section className="mt-4 overflow-hidden rounded-2xl border border-ring bg-surface/60 shadow-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner}
            alt={brand.banner?.alt ?? `Bannière ${brand.name}`}
            className="h-[160px] w-full object-cover sm:h-[220px]"
            loading="lazy"
            decoding="async"
          />
        </section>
      ) : null}

      {/* En-tête marque */}
      <header className="mt-4 card p-4 flex items-center gap-4">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt={brand.logo?.alt ?? `${brand.name} logo`}
            width={64}
            height={64}
            className="h-16 w-16 rounded-xl border border-ring bg-white object-contain p-2"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="h-16 w-16 rounded-xl border border-ring bg-muted flex items-center justify-center text-xs text-slate-500">
            Logo
          </div>
        )}

        <div className="min-w-0">
          <h1 className="text-xl font-bold">{brand.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            {brand.websiteUrl ? (
              <a className="text-sm text-blue-600 underline" href={brand.websiteUrl} target="_blank" rel="noreferrer">
                Site officiel
              </a>
            ) : null}
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-600">Marque</span>
          </div>
        </div>
      </header>

      {/* Description */}
      {brand.description ? (
        <section className="rounded-2xl border border-ring bg-surface/60 p-5 shadow-card my-4">
          <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(brand.description) }} />
        </section>
      ) : null}

      {/* Produits */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold mb-3">Produits {brand.name}</h2>
        {productsWithPrice.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {productsWithPrice.map((p) => {
              const cardTitle = [p.brand ?? brand.name, p.model, p.season].filter(Boolean).join(" ");
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
          <p className="text-neutral-600">Aucun produit associé pour le moment.</p>
        )}
      </section>
    </div>
  );
}
