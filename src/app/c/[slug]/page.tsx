import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props) {
  const cat = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!cat || !cat.published) return {};

  const title = cat.metaTitle || `${cat.name} | Achat-Ski`;
  const description = cat.metaDescription || (cat.intro || `Guide d'achat et comparatif ${cat.name} : tests, avis et meilleurs prix.`);

  return { title, description };
}

export default async function CategoryPage({ params }: Props) {
  const cat = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      children: { where: { published: true }, orderBy: [{ order: "asc" }, { name: "asc" }] },
      products: { take: 24, orderBy: { id: "desc" } },
    },
  });

  if (!cat || !cat.published) return notFound();

  return (
    <main className="container mx-auto max-w-5xl py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{cat.name}</h1>
        {cat.intro && <p className="text-muted-foreground">{cat.intro}</p>}
      </header>

      {cat.content && (
        <article className="prose max-w-none">
          {/* Tu peux brancher un renderer Markdown ici si besoin */}
          <pre className="whitespace-pre-wrap text-sm">{cat.content}</pre>
        </article>
      )}

      {cat.children.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-medium">Sous-catégories</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {cat.children.map(sc => (
              <li key={sc.slug} className="rounded-xl border p-4 hover:bg-accent/30">
                <a href={`/c/${sc.slug}`} className="font-medium">{sc.name}</a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Placeholder produits rattachés */}
      {cat.products.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-medium">Produits populaires</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {cat.products.map(p => (
              <a key={p.id} href={`/p/${p.slug}`} className="rounded-xl border p-4 hover:bg-accent/30">
                <div className="font-medium">{p.brand} {p.model}</div>
                {p.season && <div className="text-xs text-muted-foreground">{p.season}</div>}
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
