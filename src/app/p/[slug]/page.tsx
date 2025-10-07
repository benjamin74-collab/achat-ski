// src/app/p/[slug]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PriceTable from "@/components/PriceTable";
import Breadcrumbs from "@/components/Breadcrumbs";
import { money } from "@/lib/format";
import type { Metadata } from "next";

export const runtime = "nodejs";
export const revalidate = 60; // ISR 60s

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: { brand: true, model: true, season: true, slug: true },
  });

  if (!p) return { title: "Produit introuvable" };

  const name = [p.brand, p.model, p.season].filter(Boolean).join(" ");
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://achat-ski.vercel.app"}/p/${p.slug}`;

  return {
    title: `${name} — meilleur prix`,
    description: `Compare les prix ${name} chez les meilleurs marchands de ski.`,
    alternates: { canonical: url },
    openGraph: { title: `${name} — meilleur prix`, url },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    // On récupère tous les scalaires du produit (dont description),
    // et on inclut les relations nécessaires.
    include: {
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
        select: {
          id: true,
          title: true,
          excerpt: true,
          score: true,
          sourceName: true,
          sourceUrl: true,
          publishedAt: true,
        },
        orderBy: { publishedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!product) return notFound();

  // ---- Prix / Offres
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
    }))
  );

  const title = [product.brand, product.model, product.season].filter(Boolean).join(" ");

  const minPriceCents = offersFlat
    .filter((o) => o.inStock)
    .reduce<number | null>((acc, o) => {
      const total = o.priceCents + (o.shippingCents ?? 0);
      return acc == null || total < acc ? total : acc;
    }, null);

  const specs: Array<[string, string]> = [
    ["Marque", product.brand ?? "—"],
    ["Modèle", product.model ?? "—"],
    ["Saison", product.season ?? "—"],
    ["Catégorie", product.category ?? "—"],
  ];

  const related = await prisma.product.findMany({
    where: {
      id: { not: product.id },
    ...(product.brand ? { brand: product.brand } : {}),
    ...(product.category ? { category: product.category } : {}),
    },
    take: 6,
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, brand: true, model: true, season: true },
  });

  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://achat-ski.vercel.app"}/p/${product.slug}`;

  // ---- Avis (reviews)
  const reviewCount = product.reviews.length;
  const averageRating =
    reviewCount > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null;

  // ---- Tests (editorial tests)
  const tests = product.tests;

  // ---- JSON-LD
  const inStockOffers = offersFlat.filter((o) => o.inStock);
  const hasStock = inStockOffers.length > 0;

  const minPriceOffer =
    inStockOffers.length > 0
      ? [...inStockOffers].sort(
          (a, b) => a.priceCents + (a.shippingCents ?? 0) - (b.priceCents + (b.shippingCents ?? 0))
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
          author: r.authorName || r.sourceName || "Utilisateur",
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

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    sku: product.skus?.[0]?.variant ?? undefined,
    gtin13: product.skus?.[0]?.gtin ?? undefined,
    category: product.category ?? undefined,
    url: canonicalUrl,
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
                  availability: offersFlat[0].inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
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
          },
        }
      : {}),
    ...(reviewJsonLd ? { review: reviewJsonLd } : {}),
  } satisfies Record<string, unknown>;

  // Description (si présente)
  const desc = (product as { description?: string | null }).description ?? null;

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />

      {/* JSON-LD Product */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />

      <Breadcrumbs
        items={[
          { label: "Accueil", href: "/" },
          { label: product.category ?? "Catégorie", href: product.category ? `/c/${product.category}` : undefined },
          { label: title },
        ]}
      />

      {/* En-tête produit */}
      <section className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-gray-50" />
          <p className="mt-2 text-xs text-neutral-500">Photo à venir (marque / feed partenaire).</p>
        </div>

        <div className="lg:col-span-7">
          <h1 className="text-2xl font-semibold">{title}</h1>

          <div className="mt-1 text-neutral-600">
            {product.category ?? "—"} ·{" "}
            {product.brand ? (
              <a href={`/b/${encodeURIComponent(product.brand)}`} className="underline hover:no-underline">
                {product.brand}
              </a>
            ) : (
              "—"
            )}
          </div>

          {/* Résumé notes si dispo */}
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

          <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {specs.map(([k, v]) => (
              <div key={k} className="rounded-xl border p-3">
                <dt className="text-xs uppercase tracking-wide text-neutral-500">{k}</dt>
                <dd className="text-sm">{v}</dd>
              </div>
            ))}
          </dl>

          {/* Description si présente */}
          {desc && desc.trim() && (
            <section className="mt-6 rounded-2xl border border-ring bg-card/60 p-5 shadow-card">
              <h2 className="text-lg font-semibold">Description</h2>
              <div className="prose prose-invert prose-a:text-brand-400 max-w-none mt-2">
                {desc.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para.trim()}</p>
                ))}
              </div>
            </section>
          )}

          {/* Avis si présents */}
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
                        {r.sourceName ? r.sourceName : r.authorName || "Utilisateur"} ·{" "}
                        {r.createdAt.toISOString().slice(0, 10)}
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

          {/* Tests/Essais si présents */}
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
                    <div className="mt-2 flex items-center justify-between">
                      {typeof t.score === "number" ? (
                        <span className="inline-flex items-center text-xs text-neutral-700">
                          Note: <b className="ml-1">{t.score}</b>
                        </span>
                      ) : <span />}
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

      {/* Tableau des prix */}
      <section className="mt-8 rounded-2xl border border-ring bg-card/60 p-5 shadow-card">
        <h2 className="text-xl font-semibold">Comparer les prix</h2>
        <PriceTable offers={offersFlat} />
      </section>

      {/* Produits similaires */}
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Produits similaires</h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <li key={r.id} className="rounded-2xl border p-4 hover:shadow-sm transition">
                <a href={`/p/${r.slug}`} className="block">
                  <div className="aspect-[4/3] w-full rounded-xl bg-gray-50 border" />
                  <div className="mt-2 text-sm font-medium">
                    {[r.brand, r.model, r.season].filter(Boolean).join(" ")}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-xs text-neutral-500">
        Les prix sont susceptibles d’évoluer. Certains liens sont affiliés.
      </p>
    </main>
  );
}

/** Petit composant local pour afficher des étoiles (0..5, pas de dépendance externe) */
function StarRating({ value }: { value: number }) {
  const full = Math.floor(Math.max(0, Math.min(5, value)));
  const half = value - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span aria-label={`${value} sur 5`} className="inline-flex items-center">
      {"★".repeat(full)}
      {half ? "☆" : ""}
      {"☆".repeat(empty)}
    </span>
  );
}
