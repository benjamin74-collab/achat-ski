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
    openGraph: {
      title: `${name} — meilleur prix`,
      url,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      skus: {
        include: {
          offers: {
            include: { merchant: true },
          },
        },
      },
    },
  });

  if (!product) return notFound();

  // Aplatir les offres (une par SKU)
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
  const minPrice = offersFlat
    .filter((o) => o.inStock)
    .reduce<number | null>((acc, o) => {
      const total = o.priceCents + (o.shippingCents ?? 0);
      return acc == null || total < acc ? total : acc;
    }, null);

  // Petites “spécs” (placeholder, à enrichir plus tard)
  const specs: Array<[string, string]> = [
    ["Marque", product.brand ?? "—"],
    ["Modèle", product.model ?? "—"],
    ["Saison", product.season ?? "—"],
    ["Catégorie", product.category ?? "—"],
  ];

  // Produits similaires simples : même marque + catégorie
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

  // JSON-LD Product (SEO)
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: title,
    brand: product.brand ?? undefined,
    category: product.category ?? undefined,
    sku: product.skus[0]?.gtin ?? undefined,
    offers:
      offersFlat.length > 0
        ? offersFlat.map((o) => ({
            "@type": "Offer",
            priceCurrency: o.currency,
            price: (o.priceCents / 100).toFixed(2),
            availability: o.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `https://achat-ski.vercel.app/api/go/${o.merchantSlug}/${o.id}`,
            seller: { "@type": "Organization", name: o.merchantName },
          }))
        : undefined,
  };

	const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://achat-ski.vercel.app"}/p/${product.slug}`;

	// Prix min / max et disponibilité globale (si au moins une offre en stock)
	const inStockOffers = offersFlat.filter(o => o.inStock);
	const hasStock = inStockOffers.length > 0;

	const minPriceOffer = offersFlat
	  .filter(o => o.inStock)
	  .sort((a,b) => (a.priceCents + (a.shippingCents ?? 0)) - (b.priceCents + (b.shippingCents ?? 0)))[0];

	const currency = minPriceOffer?.currency ?? "EUR";
	const minPrice = minPriceOffer ? (minPriceOffer.priceCents + (minPriceOffer.shippingCents ?? 0)) / 100 : undefined;
	const maxPrice = offersFlat.length
	  ? Math.max(...offersFlat.map(o => (o.priceCents + (o.shippingCents ?? 0)) / 100))
	  : undefined;

	// JSON-LD Product
	const productJsonLd: Record<string, any> = {
	  "@context": "https://schema.org",
	  "@type": "Product",
	  name: [product.brand, product.model, product.season].filter(Boolean).join(" "),
	  brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
	  sku: product.skus?.[0]?.variant ?? undefined,
	  gtin13: product.skus?.[0]?.gtin ?? undefined,
	  category: product.category ?? undefined,
	  url: canonicalUrl,
	};

	// Ajoute AggregateRating plus tard si tu as des avis réels
	// Ajoute image[] si tu as des URLs d'images produits stables
	// productJsonLd.image = ["https://cdn.../image1.jpg", "https://.../image2.jpg"];

	if (offersFlat.length > 0) {
	  if (offersFlat.length > 1) {
		productJsonLd.offers = {
		  "@type": "AggregateOffer",
		  priceCurrency: currency,
		  lowPrice: typeof minPrice === "number" ? minPrice.toFixed(2) : undefined,
		  highPrice: typeof maxPrice === "number" ? maxPrice.toFixed(2) : undefined,
		  offerCount: offersFlat.length,
		  availability: hasStock
			? "https://schema.org/InStock"
			: "https://schema.org/OutOfStock",
		  url: canonicalUrl,
		};
	  } else {
		const o = offersFlat[0];
		productJsonLd.offers = {
		  "@type": "Offer",
		  priceCurrency: o.currency,
		  price: ((o.priceCents + (o.shippingCents ?? 0)) / 100).toFixed(2),
		  availability: o.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
		  url: canonicalUrl,
		};
	  }
	}

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
	{/* Canonical explicite (utile si tu varies d’environnement) */}
		<link rel="canonical" href={canonicalUrl} />

		{/* JSON-LD Product */}
		<script
		  type="application/ld+json"
		  // eslint-disable-next-line react/no-danger
		  dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
		/>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
        {/* Galerie / visuel placeholder (à brancher plus tard) */}
        <div className="lg:col-span-5">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-gray-50" />
          <p className="mt-2 text-xs text-neutral-500">
            Photo à venir (marque / feed partenaire).
          </p>
        </div>

        {/* Infos principales */}
        <div className="lg:col-span-7">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <div className="mt-1 text-neutral-600">{product.category ?? "—"}</div>

          {/* Prix mini */}
          <div className="mt-3 rounded-xl border p-4">
            <div className="text-sm text-neutral-500">à partir de</div>
            <div className="text-3xl font-bold">
              {minPrice != null ? money(minPrice, "EUR") : "—"}
            </div>
            <div className="mt-1 text-sm text-neutral-500">chez nos marchands partenaires</div>
          </div>

          {/* Spécifications (placeholder) */}
          <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {specs.map(([k, v]) => (
              <div key={k} className="rounded-xl border p-3">
                <dt className="text-xs uppercase tracking-wide text-neutral-500">{k}</dt>
                <dd className="text-sm">{v}</dd>
              </div>
            ))}
          </dl>
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
