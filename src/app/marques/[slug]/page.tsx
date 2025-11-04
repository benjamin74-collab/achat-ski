import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";
import { sanitizeHtml } from "@/lib/sanitize";
import { totalCents } from "@/lib/format";
import ProductCard from "@/components/ProductCard";

export const revalidate = 300;

export async function generateStaticParams() {
  const brands = await prisma.brand.findMany({ where: { active: true }, select: { slug: true } });
  return brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const brand = await prisma.brand.findUnique({ where: { slug: params.slug }, select: { name: true, description: true } });
  if (!brand) return { title: "Marque introuvable — Meilleur-Ski" };
  return {
    title: `${brand.name} — Tests, prix et produits`,
    description: brand.description ? brand.description.replace(/<[^>]+>/g, "").slice(0, 160) : `Produits ${brand.name} : tests, prix, comparatifs.`,
  };
}

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const brand = await prisma.brand.findUnique({ where: { slug: params.slug } });
  if (!brand || !brand.active) {
    return (
      <div className="container-page py-8">
        <Breadcrumbs items={[{ href: "/", label: "Accueil" }, { href: "/marques", label: "Marques" }]} />
        <h1 className="text-xl font-semibold">Marque introuvable</h1>
      </div>
    );
  }

  // Produits liés :
  // 1) via FK brandId
  // 2) fallback via string brand == brand.name (compat)
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { brandId: brand.id },
        { brand: brand.name }
      ]
    },
    include: { category: { select: { name: true } }, skus: { include: { offers: true } } },
    take: 60,
    orderBy: { id: "desc" }
  });

  const productsWithPrice = products.map((p) => {
    const allOffers = p.skus.flatMap((s) => s.offers);
    const minTotal = allOffers.length
      ? allOffers.map((o) => totalCents(o.priceCents, o.shippingCents ?? 0))
          .reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY)
      : null;
    return { ...p, minTotal };
  });

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ href: "/", label: "Accueil" }, { href: "/marques", label: "Marques" }, { label: brand.name }]} />

      <header className="card p-4 flex items-center gap-4">
        {brand.logoUrl ? <img src={brand.logoUrl} alt="" width={60} height={60} /> : null}
        <div>
          <h1 className="text-xl font-bold">{brand.name}</h1>
          {brand.websiteUrl && (
            <a className="text-sm text-blue-600 underline" href={brand.websiteUrl} target="_blank" rel="noreferrer">
              Site officiel
            </a>
          )}
        </div>
      </header>

      {brand.description && (
        <section className="rounded-2xl border border-ring bg-surface/60 p-5 shadow-card my-4">
          <article
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(brand.description) }}
          />
        </section>
      )}

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
