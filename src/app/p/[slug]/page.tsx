import ProductSummary from "../../../components/ProductSummary";
import PriceTable from "../../../components/PriceTable";
import Specs from "../../../components/Specs";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { prisma } from "../../../lib/prisma";
import { totalCents } from "../../../lib/format";

export const revalidate = 300;

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const p = await prisma.product.findUnique({ where: { slug } });
  if (!p) return { title: "Produit introuvable" };
  const title = `${p.brand} ${p.model} ${p.season ?? ""} — prix & comparateur | Achat-Ski`;
  const description = `Comparez les prix du ${p.brand} ${p.model} ${p.season ?? ""} chez nos marchands partenaires.`;
  return { title, description };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      skus: { include: { offers: { include: { merchant: true } } } },
    },
  });

  if (!product) return <main className="container-page py-12">Produit introuvable.</main>;

  // Aplatit toutes les offres
  const offersFlat = product.skus.flatMap(sku =>
    sku.offers.map(o => ({
      id: o.id,
      productId: product.id,
      merchantName: o.merchant.name,
      merchantSlug: o.merchant.slug,
      priceCents: o.priceCents,
      shippingCents: o.shippingCents ?? 0,
      currency: o.currency,
      inStock: o.inStock,
      lastSeen: o.lastSeen?.toISOString() ?? null,
      affiliateUrl: o.affiliateUrl,
    }))
  );

  // JSON-LD (Offer + Product) basique
  const bestTotal = offersFlat
    .filter(o => o.inStock)
    .map(o => totalCents(o.priceCents, o.shippingCents))
    .reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand} ${product.model} ${product.season ?? ""}`,
    brand: { "@type": "Brand", name: product.brand },
    sku: product.skus[0]?.gtin ?? undefined,
    offers: offersFlat.map(o => ({
      "@type": "Offer",
      priceCurrency: o.currency,
      price: (o.priceCents / 100).toFixed(2),
      availability: o.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: o.affiliateUrl,
      seller: { "@type": "Organization", name: o.merchantName },
    })),
    ...(Number.isFinite(bestTotal) ? { lowPrice: (bestTotal / 100).toFixed(2) } : {}),
  };

  return (
    <main className="container-page py-10">
      <Breadcrumbs
        items={[
          { href: "/", label: "Accueil" },
          { href: `/c/${product.category ?? "skis-all-mountain"}`, label: product.category ?? "Catégorie" },
          { label: `${product.brand} ${product.model}` },
        ]}
      />

      <div className="mt-4 grid gap-6 md:grid-cols-12">
        {/* Colonne image */}
        <div className="md:col-span-4">
          <div className="card overflow-hidden">
            {/* Placeholder image: mettra une vraie image plus tard */}
            <div className="aspect-[4/5] bg-neutral-200" />
          </div>
        </div>

        {/* Colonne contenu */}
        <div className="md:col-span-8 flex flex-col gap-4">
          <div className="card p-6">
            <h1 className="text-2xl font-bold">
              {product.brand} {product.model} {product.season ?? ""}
            </h1>
            <p className="mt-1 text-neutral-600">Comparateur de prix chez nos marchands partenaires.</p>
          </div>

          <ProductSummary
            offers={offersFlat.map(o => ({
              priceCents: o.priceCents,
              shippingCents: o.shippingCents,
              currency: o.currency,
              inStock: o.inStock,
            }))}
          />

          <PriceTable offers={offersFlat} />

          <Specs attributes={product.attributes as Record<string, string | number | boolean | null> | null} />
        </div>
      </div>

      {/* SEO JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </main>
  );
}
