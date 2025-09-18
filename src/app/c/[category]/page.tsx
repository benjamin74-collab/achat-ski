import { prisma } from "../../../lib/prisma";
import ProductCard from "../../../components/ProductCard";
import { categoryLabel } from "../../../lib/categories";

// Revalidation douce (ISR)
export const revalidate = 120;

type PageParams = { category: string };

function getSearchParam(searchParams: URLSearchParams, key: string, def: string) {
  const v = searchParams.get(key);
  return v ?? def;
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { category } = await params;

  // pagination
  const pageSize = 12;
  const page = Number(
    Array.isArray(searchParams?.page) ? searchParams?.page[0] : searchParams?.page ?? "1"
  );
  const skip = (Math.max(1, page) - 1) * pageSize;

  // total + items
  const [total, items] = await Promise.all([
    prisma.product.count({ where: { category } }),
    prisma.product.findMany({
      where: { category },
      orderBy: { id: "desc" },
      skip,
      take: pageSize,
      select: { id: true, brand: true, model: true, season: true, slug: true },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const title = categoryLabel(category);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-neutral-600">
        {total} produit{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}.
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((p) => (
          <ProductCard
            key={p.id}
            slug={p.slug}
            brand={p.brand}
            model={p.model}
            season={p.season}
          />
        ))}
      </div>

      {/* Pagination simple */}
      {pages > 1 && (
        <nav className="mt-8 flex items-center gap-2">
          <a
            className={`rounded-lg border px-3 py-1.5 ${
              page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-neutral-50"
            }`}
            href={`?page=${page - 1}`}
            aria-disabled={page <= 1}
          >
            ← Précédent
          </a>
          <span className="text-sm text-neutral-600">
            Page {page} / {pages}
          </span>
          <a
            className={`rounded-lg border px-3 py-1.5 ${
              page >= pages ? "pointer-events-none opacity-50" : "hover:bg-neutral-50"
            }`}
            href={`?page=${page + 1}`}
            aria-disabled={page >= pages}
          >
            Suivant →
          </a>
        </nav>
      )}
    </main>
  );
}

// SEO basique
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
