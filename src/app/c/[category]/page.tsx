import { prisma } from "../../../lib/prisma";
import ProductCard from "../../../components/ProductCard";
import { categoryLabel } from "../../../lib/categories";
import { totalCents } from "../../../lib/format";
import Link from "next/link";

export const revalidate = 120;

type PageParams = { category: string };

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { category } = await params;

  const pageSize = 12;
  const page = Number(
    Array.isArray(searchParams?.page) ? searchParams?.page[0] : searchParams?.page ?? "1"
  );
  const skip = (Math.max(1, page) - 1) * pageSize;

  // Récupérer produits + prix minimum (offres des skus)
  const [total, products] = await Promise.all([
    prisma.product.count({ where: { category } }),
    prisma.product.findMany({
      where: { category },
      orderBy: { id: "desc" },
      skip,
      take: pageSize,
      include: {
        skus: {
          include: {
            offers: true,
          },
        },
      },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const title = categoryLabel(category);

  return (
    <div className="container-page py-8">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-neutral-600">
          {total} produit{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {products.map((p) => {
          const allOffers = p.skus.flatMap((s) => s.offers);
          const min = allOffers.length
            ? allOffers
                .map((o) => totalCents(o.priceCents, o.shippingCents ?? 0))
                .reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY)
            : null;

          return (
            <ProductCard
              key={p.id}
              slug={p.slug}
              brand={p.brand}
              model={p.model}
              season={p.season}
              minTotalCents={min}
              currency="EUR"
            />
          );
        })}
      </div>

      {/* Pagination simple */}
		{pages > 1 && (
		  <nav className="mt-8 flex items-center gap-2">
			<Link
			  className={`btn ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
			  href={`?page=${page - 1}`}
			  aria-disabled={page <= 1}
			>
			  ← Précédent
			</Link>
			<span className="text-sm text-neutral-600">
			  Page {page} / {pages}
			</span>
			<Link
			  className={`btn ${page >= pages ? "pointer-events-none opacity-50" : ""}`}
			  href={`?page=${page + 1}`}
			  aria-disabled={page >= pages}
			>
			  Suivant →
			</Link>
		  </nav>
		)}
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }) {
  const { category } = await params;
  const title = `${categoryLabel(category)} — Achat-Ski`;
  return {
    title,
    description: `Comparez les prix des produits ${categoryLabel(
      category
    )} chez nos marchands partenaires.`,
  };
}
