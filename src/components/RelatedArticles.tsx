// src/components/RelatedArticles.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

function initials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default async function RelatedArticles({ currentSlug, max = 6 }: { currentSlug: string; max?: number }) {
  const items = await prisma.page.findMany({
    where: { published: true, NOT: { slug: currentSlug } },
    orderBy: { createdAt: "desc" },
    take: max,
    select: {
      id: true,
      slug: true,
      title: true,
      intro: true,
      thumbnailUrl: true,
      thumbnail: { select: { publicUrl: true } },
      guideCategory: { select: { name: true } },
    },
  });

  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Continuer la lecture
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
            À lire aussi
          </h2>
        </div>

        <Link
          href="/pages"
          className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
        >
          Tous les guides
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => {
          const img = a.thumbnail?.publicUrl ?? a.thumbnailUrl;

          return (
            <li
              key={a.id}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <Link href={`/pages/${a.slug}`} className="block h-full">
                <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt={a.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,.18),transparent_35%),linear-gradient(135deg,#f8fafc,#e2e8f0)]">
                      <span className="rounded-2xl bg-white/80 px-4 py-3 text-lg font-black text-brand-700 shadow-sm ring-1 ring-slate-200">
                        {initials(a.title)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  {a.guideCategory?.name ? (
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {a.guideCategory.name}
                    </div>
                  ) : null}

                  <h3 className="text-sm font-bold leading-snug text-slate-950 group-hover:text-brand-700">
                    {a.title}
                  </h3>

                  {a.intro ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                      {a.intro}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}