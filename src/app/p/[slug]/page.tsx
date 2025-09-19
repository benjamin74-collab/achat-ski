import PriceTable from "../../../components/PriceTable";
import { prisma } from "../../../lib/prisma";
import Breadcrumbs from "../../../components/Breadcrumbs";

export const revalidate = 300; // ISR 5 min

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const p = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!p) return { title: "Produit introuvable" };
  return {
    title: `${p.brand} ${p.model} ${p.season ?? ""} — prix & comparateur | Achat-Ski`,
    description: `Comparez les prix du ${p.brand} ${p.model} ${p.season ?? ""} chez Ekosport, Snowleader, Glisshop…`,
  };
}

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
    }))
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
	<Breadcrumbs items={[
	  { href: "/", label: "Accueil" },
	  { href: `/c/${product.category ?? "skis-all-mountain"}`, label: product.category ?? "Catégorie" },
	  { label: `${product.brand} ${product.model}` }
	]} />
      <h1 className="text-2xl font-bold">
        {product.brand} {product.model} {product.season ?? ""}
      </h1>
      <p className="mt-2 text-neutral-600">Comparez les prix chez nos marchands partenaires.</p>

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
