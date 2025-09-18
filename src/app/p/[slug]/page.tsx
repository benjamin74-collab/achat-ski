import { prisma } from "../../../lib/prisma";
import PriceTable from "@/components/PriceTable";

export default async function ProductPage({ params }: { params: { slug: string } }) {
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

  if (!product) return <main className="p-10">Produit introuvable.</main>;

  // Aplatis toutes les offres des SKUs et calcule le total pour trier
  const offersFlat = product.skus
    .flatMap(sku =>
      sku.offers.map(o => ({
        id: o.id,
        productId: product.id,
        merchantName: o.merchant.name,
        merchantSlug: o.merchant.slug,
        priceCents: o.priceCents,
        shippingCents: o.shippingCents ?? 0,
        currency: o.currency,
        inStock: o.inStock,
      }))
    )
    .sort((a, b) => (a.priceCents + (a.shippingCents ?? 0)) - (b.priceCents + (b.shippingCents ?? 0)));

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-bold">
        {product.brand} {product.model} {product.season ?? ""}
      </h1>
      <p className="mt-2 text-neutral-600">Comparateur de prix sur nos marchands partenaires.</p>

      <PriceTable offers={offersFlat} />

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Caractéristiques</h2>
        <pre className="mt-2 rounded-lg border bg-neutral-50 p-3 text-sm overflow-x-auto">
          {JSON.stringify(product.attributes ?? {}, null, 2)}
        </pre>
      </section>
    </main>
  );
}
