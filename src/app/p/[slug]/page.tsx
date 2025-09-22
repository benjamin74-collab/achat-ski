// src/app/p/[slug]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PriceTable from "@/components/PriceTable";
import Breadcrumbs from "@/components/Breadcrumbs";
import { money } from "@/lib/format";

export const runtime = "nodejs";
export const revalidate = 60; // ISR 60s

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps) {
  const p = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: { brand: true, model: true, season: true, category: true },
  });
  if (!p) return {};
  const title = [p.brand, p.model, p.season].filter(Boolean).join(" ");
  const desc = `Comparez les prix de ${title} (${p.category ?? "matériel de ski"}) parmi les principaux marchands.`;
  const url = `https://achat-ski.vercel.app/p/${params.slug}`;
  return {
    title: `${title} | Achat-Ski`,
    description: desc,
    alternates: { canonical: url },
    openGraph: { title, description: desc, url },
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
    sku: product.skus[0]?.code ?? undefined,
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

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
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
