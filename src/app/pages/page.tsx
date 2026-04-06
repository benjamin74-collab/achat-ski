// src/app/pages/page.tsx
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getCurrentSiteUrl } from "@/lib/currentSite";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

function formatDateISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function PagesIndex() {
  const site = getCurrentSiteUrl();
  const canonicalUrl = `${site}/pages`;

  const [guideCategories, latestUngrouped] = await Promise.all([
    prisma.guideCategory.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        pages: {
          where: { published: true, kind: "GUIDE" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            slug: true,
            title: true,
            intro: true,
            createdAt: true,
            thumbnailUrl: true,
            thumbnail: { select: { publicUrl: true, alt: true } },
          },
        },
      },
    }),
    prisma.page.findMany({
      where: {
        published: true,
        kind: "GUIDE",
        guideCategoryId: null,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        intro: true,
        createdAt: true,
        thumbnailUrl: true,
        thumbnail: { select: { publicUrl: true, alt: true } },
      },
    }),
  ]);

  const visibleCategories = guideCategories.filter((cat) => cat.pages.length > 0);

  const totalGuides =
    visibleCategories.reduce((sum, cat) => sum + cat.pages.length, 0) + latestUngrouped.length;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${site}/` },
      { "@type": "ListItem", position: 2, name: "Guides", item: canonicalUrl },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Guides ski",
    url: canonicalUrl,
    about: "Guides et conseils pour choisir son matériel de ski",
    hasPart: visibleCategories.map((cat) => ({
      "@type": "ItemList",
      name: cat.name,
      numberOfItems: cat.pages.length,
      itemListElement: cat.pages.map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `${site}/pages/${p.slug}`,
        name: p.title,
      })),
    })),
  };

  return (
    <main className="container-page py-8">
      <link rel="canonical" href={canonicalUrl} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <header className="rounded-3xl border bg-white p-6 md:p-8 shadow-card">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-brand-700">Hub éditorial</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Guides ski, conseils et comparatifs
          </h1>
          <p className="mt-4 text-base md:text-lg text-slate-700 leading-relaxed">
            Retrouve ici nos guides pour choisir ton matériel, mieux comprendre les
            différentes pratiques, progresser sur neige et comparer plus efficacement
            les équipements avant achat.
          </p>
          <div className="mt-4 text-sm text-slate-600">
            {totalGuides} guide{totalGuides > 1 ? "s" : ""} publié{totalGuides > 1 ? "s" : ""}
          </div>
        </div>
      </header>

      {visibleCategories.length > 0 ? (
        <nav className="mt-6 flex flex-wrap gap-2">
          {visibleCategories.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.slug}`}
              className="rounded-full border bg-white px-4 py-2 text-sm font-medium hover:shadow-card transition"
            >
              {cat.name}
            </a>
          ))}
          {latestUngrouped.length > 0 ? (
            <a
              href="#autres-guides"
              className="rounded-full border bg-white px-4 py-2 text-sm font-medium hover:shadow-card transition"
            >
              Autres guides
            </a>
          ) : null}
        </nav>
      ) : null}

      <div className="mt-8 space-y-10">
        {visibleCategories.map((cat) => (
          <section key={cat.id} id={cat.slug} className="scroll-mt-28">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">{cat.name}</h2>
              {cat.description ? (
                <p className="mt-2 text-slate-600 max-w-3xl">{cat.description}</p>
              ) : null}
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.pages.map((p) => {
                const thumb = p.thumbnail?.publicUrl || p.thumbnailUrl || null;

                return (
                  <li
                    key={p.id}
                    className="rounded-2xl border border-ring bg-white hover:shadow-card transition"
                  >
                    <Link href={`/pages/${p.slug}`} className="block">
                      <div className="aspect-[16/9] w-full overflow-hidden rounded-t-2xl bg-muted">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={p.thumbnail?.alt ?? p.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-muted to-white" />
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="text-base font-semibold">{p.title}</h3>
                        {p.intro ? (
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{p.intro}</p>
                        ) : null}
                        <div className="mt-2 text-xs text-slate-500">
                          Publié le {formatDateISO(p.createdAt)}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {latestUngrouped.length > 0 ? (
          <section id="autres-guides" className="scroll-mt-28">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">Autres guides</h2>
              <p className="mt-2 text-slate-600 max-w-3xl">
                Guides publiés sans catégorie éditoriale spécifique.
              </p>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestUngrouped.map((p) => {
                const thumb = p.thumbnail?.publicUrl || p.thumbnailUrl || null;

                return (
                  <li
                    key={p.id}
                    className="rounded-2xl border border-ring bg-white hover:shadow-card transition"
                  >
                    <Link href={`/pages/${p.slug}`} className="block">
                      <div className="aspect-[16/9] w-full overflow-hidden rounded-t-2xl bg-muted">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={p.thumbnail?.alt ?? p.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-muted to-white" />
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="text-base font-semibold">{p.title}</h3>
                        {p.intro ? (
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{p.intro}</p>
                        ) : null}
                        <div className="mt-2 text-xs text-slate-500">
                          Publié le {formatDateISO(p.createdAt)}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}