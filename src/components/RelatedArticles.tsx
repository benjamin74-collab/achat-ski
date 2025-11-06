// src/components/RelatedArticles.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function RelatedArticles({ currentSlug, max = 6 }: { currentSlug: string; max?: number }) {
  const items = await prisma.page.findMany({
    where: { published: true, NOT: { slug: currentSlug } },
    orderBy: { createdAt: "desc" },
    take: max,
    select: { id: true, slug: true, title: true, thumbnailUrl: true }
  });

  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold">À lire aussi…</h2>
      <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(a => (
          <li key={a.id} className="rounded-2xl border hover:shadow-card transition">
            <Link href={`/pages/${a.slug}`} className="block">
              <div className="aspect-[16/9] w-full overflow-hidden rounded-t-2xl bg-muted">
                {a.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.thumbnailUrl} alt={a.title} className="h-full w-full object-cover" loading="lazy" />
                ) : null}
              </div>
              <div className="p-4 text-sm font-medium">{a.title}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
