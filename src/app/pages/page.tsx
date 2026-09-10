/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  getCurrentSiteId,
  getCurrentSiteUrl,
} from "@/lib/currentSite";
import { getSiteConfig } from "@/config/site";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

function formatDateISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function PagesIndex() {
  const [siteId, site] = await Promise.all([
    getCurrentSiteId(),
    getCurrentSiteUrl(),
  ]);

  const siteConfig = getSiteConfig(siteId);
  const canonicalUrl = `${site}/pages`;

  const [guideCategories, latestUngrouped] =
    await Promise.all([
      prisma.guideCategory.findMany({
        where: {
          active: true,
        },

        orderBy: [
          { order: "asc" },
          { name: "asc" },
        ],

        select: {
          id: true,
          name: true,
          slug: true,
          description: true,

          pages: {
            where: {
              published: true,

              kind: {
                in: ["GUIDE", "COMPARATIF"],
              },
            },

            orderBy: {
              createdAt: "desc",
            },

            select: {
              id: true,
              slug: true,
              title: true,
              intro: true,
              kind: true,
              createdAt: true,
              thumbnailUrl: true,

              thumbnail: {
                select: {
                  publicUrl: true,
                  alt: true,
                },
              },
            },
          },
        },
      }),

      prisma.page.findMany({
        where: {
          published: true,

          kind: {
            in: ["GUIDE", "COMPARATIF"],
          },

          guideCategoryId: null,
        },

        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          slug: true,
          title: true,
          intro: true,
          kind: true,
          createdAt: true,
          thumbnailUrl: true,

          thumbnail: {
            select: {
              publicUrl: true,
              alt: true,
            },
          },
        },
      }),
    ]);

  const visibleCategories =
    guideCategories.filter(
      (cat) => cat.pages.length > 0
    );

  const allPages = [
    ...visibleCategories.flatMap(
      (cat) => cat.pages
    ),
    ...latestUngrouped,
  ];

  const totalGuides =
    allPages.filter(
      (page) => page.kind === "GUIDE"
    ).length;

  const totalComparatifs =
    allPages.filter(
      (page) => page.kind === "COMPARATIF"
    ).length;

  const totalContents =
    totalGuides + totalComparatifs;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",

    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: `${site}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides et comparatifs",
        item: canonicalUrl,
      },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",

    name: `Guides et comparatifs — ${siteConfig.name}`,

    url: canonicalUrl,

    about: `Guides, conseils et comparatifs proposés par ${siteConfig.name}`,

    hasPart: visibleCategories.map(
      (cat) => ({
        "@type": "ItemList",
        name: cat.name,

        numberOfItems:
          cat.pages.length,

        itemListElement:
          cat.pages.map(
            (p, idx) => ({
              "@type": "ListItem",
              position: idx + 1,
              url: `${site}/pages/${p.slug}`,
              name: p.title,
            })
          ),
      })
    ),
  };

  return (
    <main className="container-page py-8">
      <link
        rel="canonical"
        href={canonicalUrl}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              breadcrumbJsonLd
            ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              itemListJsonLd
            ),
        }}
      />

      <header className="rounded-3xl border bg-white p-6 shadow-card md:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-brand-700">
            Hub éditorial
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Guides, conseils et comparatifs
          </h1>

          <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">
            Retrouvez nos guides pour mieux
            comprendre les équipements,
            choisir les produits adaptés à
            votre pratique et consulter nos
            comparatifs avant achat.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
              {totalContents} contenu
              {totalContents > 1 ? "s" : ""}
            </span>

            <span className="rounded-full bg-brand-50 px-3 py-1.5 font-semibold text-brand-700">
              {totalGuides} guide
              {totalGuides > 1 ? "s" : ""}
            </span>

            <span className="rounded-full bg-sky-50 px-3 py-1.5 font-semibold text-sky-700">
              {totalComparatifs} comparatif
              {totalComparatifs > 1
                ? "s"
                : ""}
            </span>
          </div>
        </div>
      </header>

      {visibleCategories.length > 0 ? (
        <nav className="mt-6 flex flex-wrap gap-2">
          {visibleCategories.map(
            (cat) => (
              <a
                key={cat.id}
                href={`#${cat.slug}`}
                className="rounded-full border bg-white px-4 py-2 text-sm font-medium transition hover:shadow-card"
              >
                {cat.name}
              </a>
            )
          )}

          {latestUngrouped.length >
          0 ? (
            <a
              href="#autres-contenus"
              className="rounded-full border bg-white px-4 py-2 text-sm font-medium transition hover:shadow-card"
            >
              Autres contenus
            </a>
          ) : null}
        </nav>
      ) : null}

      <div className="mt-8 space-y-10">
        {visibleCategories.map(
          (cat) => (
            <section
              key={cat.id}
              id={cat.slug}
              className="scroll-mt-28"
            >
              <div className="mb-4">
                <h2 className="text-2xl font-bold">
                  {cat.name}
                </h2>

                {cat.description ? (
                  <p className="mt-2 max-w-3xl text-slate-600">
                    {cat.description}
                  </p>
                ) : null}
              </div>

              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cat.pages.map(
                  (p) => {
                    const thumb =
                      p.thumbnail
                        ?.publicUrl ||
                      p.thumbnailUrl ||
                      null;

                    const isComparatif =
                      p.kind ===
                      "COMPARATIF";

                    return (
                      <li
                        key={p.id}
                        className="overflow-hidden rounded-2xl border border-ring bg-white transition hover:-translate-y-0.5 hover:shadow-card"
                      >
                        <Link
                          href={`/pages/${p.slug}`}
                          className="block"
                        >
                          <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={
                                  p.thumbnail
                                    ?.alt ??
                                  p.title
                                }
                                className="h-full w-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-muted to-white" />
                            )}

                            <span
                              className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                                isComparatif
                                  ? "bg-sky-600 text-white"
                                  : "bg-white text-brand-700"
                              }`}
                            >
                              {isComparatif
                                ? "Comparatif"
                                : "Guide"}
                            </span>
                          </div>

                          <div className="p-4">
                            <h3 className="text-base font-semibold text-slate-950">
                              {p.title}
                            </h3>

                            {p.intro ? (
                              <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                                {p.intro}
                              </p>
                            ) : null}

                            <div className="mt-3 text-xs text-slate-500">
                              Publié le{" "}
                              {formatDateISO(
                                p.createdAt
                              )}
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  }
                )}
              </ul>
            </section>
          )
        )}

        {latestUngrouped.length >
        0 ? (
          <section
            id="autres-contenus"
            className="scroll-mt-28"
          >
            <div className="mb-4">
              <h2 className="text-2xl font-bold">
                Autres contenus
              </h2>

              <p className="mt-2 max-w-3xl text-slate-600">
                Guides et comparatifs
                publiés sans catégorie
                éditoriale spécifique.
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {latestUngrouped.map(
                (p) => {
                  const thumb =
                    p.thumbnail
                      ?.publicUrl ||
                    p.thumbnailUrl ||
                    null;

                  const isComparatif =
                    p.kind ===
                    "COMPARATIF";

                  return (
                    <li
                      key={p.id}
                      className="overflow-hidden rounded-2xl border border-ring bg-white transition hover:-translate-y-0.5 hover:shadow-card"
                    >
                      <Link
                        href={`/pages/${p.slug}`}
                        className="block"
                      >
                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={
                                p.thumbnail
                                  ?.alt ??
                                p.title
                              }
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-muted to-white" />
                          )}

                          <span
                            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                              isComparatif
                                ? "bg-sky-600 text-white"
                                : "bg-white text-brand-700"
                            }`}
                          >
                            {isComparatif
                              ? "Comparatif"
                              : "Guide"}
                          </span>
                        </div>

                        <div className="p-4">
                          <h3 className="text-base font-semibold text-slate-950">
                            {p.title}
                          </h3>

                          {p.intro ? (
                            <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                              {p.intro}
                            </p>
                          ) : null}

                          <div className="mt-3 text-xs text-slate-500">
                            Publié le{" "}
                            {formatDateISO(
                              p.createdAt
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                }
              )}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}