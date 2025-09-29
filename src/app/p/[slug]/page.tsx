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

// Petit type d’appoint pour accéder à la description si elle existe côté DB
type MaybeWithDescription = { description?: string | null };

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
    // ⚠️ pas de `select` ici -> on laisse Prisma renvoyer les scalaires connus,
    // et on inclut seulement les relations dont on a besoin.
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
              merchant: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
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
    }))
  );

  const title = [product.brand, product.model, product.season].filter(Boolean).join(" ");

  // Prix mini pour l’UI (centimes)
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
      brand: product.brand ?? undefined,
      category: product.category ?? undefined,
    },
    take: 6,
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, brand: true, model: true, season: true },
  });

  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://achat-ski.vercel.app"}/p/${product.slug}`;

  // Données JSON-LD (euros)
  const inStockOffers = offersFlat.filter((o) => o.inStock);
  const hasStock = inStockOffers.length > 0;

  const minPriceOffer = inStockOffers
    .slice()
    .sort(
      (a, b) =>
        a.priceCents + (a.shippingCents ?? 0) - (b.priceCents + (b.shippingCents ?? 0))
    )[0];

  const currency = minPriceOffer?.currency ?? "EUR";
  const minPriceEuro =
    minPriceOffer != null
      ? (minPriceOffer.priceCents + (minPriceOffer.shippingCents ?? 0)) / 100
      : undefined;

  const maxPriceEuro = offersFlat.length
    ? Math.max(...offersFlat.map((o) => (o.priceCents + (o.shippingCents ?? 0)) / 100))
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
                  availability: hasStock
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                  url: canonicalUrl,
                }
              : {
                  "@type": "Offer",
                  priceCurrency: offersFlat[0].currency,
                  price: (
                    (offersFlat[0].priceCents + (offersFlat[0].shippingCents ?? 0)) /
                    100
                  ).toFixed(2),
                  availability: offersFlat[0].inStock
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                  url: canonicalUrl,
                },
        }
      : {}),
  } satisfies Record<string, unknown>;

  // ✅ Accès optionnel à la description sans `any`
  const desc = (product as MaybeWithDescription).description ?? null;

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />

      {/* JSON-LD Product */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

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

          <div className="mt-3 rounded-xl border p-4">
            <div className="text-sm text-neutral-500">à partir de</div>
            <div className="text-3xl font-bold">
              {minPriceCents != null ? money(minPriceCents, "EUR") : "—"}
            </div>
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

          {/* ✅ Description si présente */}
          {desc && desc.trim() && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold">Description</h2>
              <div className="prose prose-sm max-w-none mt-2 text-neutral-800">
                {desc.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para.trim()}</p>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>

      {/* Tableau des prix */}
      <section className="mt-8">
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
