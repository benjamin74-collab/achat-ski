// src/app/page.tsx
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/config/site";

export const revalidate = 300;

type CategoryTile = {
  slug: string;
  title: string;
  desc: string;
  cta: string;
  img: string;
};

type TopBrand = {
  name: string;
  slug: string;
  logo: string;
};

type HeroCtaVariant = "primary" | "outline" | "secondary" | "accent";

type HeroCta = {
  label: string;
  href: string;
  variant?: HeroCtaVariant;
};

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isBool(v: unknown): v is boolean {
  return typeof v === "boolean";
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function isHeroCtaVariant(v: unknown): v is HeroCtaVariant {
  return v === "primary" || v === "outline" || v === "secondary" || v === "accent";
}

function parseCategoryTiles(v: unknown): CategoryTile[] {
  if (!isArray(v)) return [];
  const out: CategoryTile[] = [];
  for (const item of v) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    if (isString(o.slug) && isString(o.title) && isString(o.desc) && isString(o.cta) && isString(o.img)) {
      out.push({
        slug: o.slug,
        title: o.title,
        desc: o.desc,
        cta: o.cta,
        img: o.img,
      });
    }
  }
  return out;
}

function parseTopBrands(v: unknown): TopBrand[] {
  if (!isArray(v)) return [];
  const out: TopBrand[] = [];
  for (const item of v) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    if (isString(o.name) && isString(o.slug) && isString(o.logo)) {
      out.push({
        name: o.name,
        slug: o.slug,
        logo: o.logo,
      });
    }
  }
  return out;
}

function parseHeroCtas(v: unknown): HeroCta[] {
  if (!isArray(v)) return [];
  const out: HeroCta[] = [];
  for (const item of v) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    if (isString(o.label) && isString(o.href)) {
      out.push({
        label: o.label,
        href: o.href,
        variant: isHeroCtaVariant(o.variant) ? o.variant : undefined,
      });
    }
  }
  return out;
}

function ctaClass(variant?: HeroCtaVariant) {
  if (variant === "outline") return "btn-outline";
  if (variant === "secondary") return "btn-outline";
  if (variant === "accent") return "btn";
  return "btn";
}

export default async function HomePage() {
  const siteConfig = getSiteConfig();
  const site = siteConfig.domain.replace(/\/+$/, "");

  const settings = await prisma.siteSettings.findUnique({
    where: { siteId: siteConfig.id },
  });

  const home = siteConfig.home;

  const fallbackHeroTitle = home?.hero?.title ?? `Le comparateur ${siteConfig.name}`;
  const fallbackHeroHighlight = home?.hero?.highlight ?? siteConfig.name;
  const fallbackHeroSubtitle =
    home?.hero?.subtitle ?? "Configurez la homepage depuis Admin → Design (titres, sections, contenus).";

  const fallbackHeroCtas: HeroCta[] =
    home?.hero?.ctas?.map((cta) => ({
      label: cta.label,
      href: cta.href,
      variant: cta.variant,
    })) ?? [
      { label: "Rechercher", href: "/search", variant: "primary" },
      { label: "Explorer", href: "#categories", variant: "outline" },
      { label: "Guides", href: "/pages", variant: "outline" },
    ];

  const fallbackCategoryTiles: CategoryTile[] = (home?.categoryTiles ?? [])
    .filter(
      (item): item is { slug: string; title: string; desc: string; cta: string; img?: string } =>
        Boolean(item.slug && item.title && item.desc && item.cta && item.img),
    )
    .map((item) => ({
      slug: item.slug,
      title: item.title,
      desc: item.desc,
      cta: item.cta,
      img: item.img as string,
    }));

  const fallbackTopBrands: TopBrand[] = (home?.topBrands ?? [])
    .filter((item): item is { name: string; slug: string; logo?: string } => Boolean(item.name && item.slug && item.logo))
    .map((item) => ({
      name: item.name,
      slug: item.slug,
      logo: item.logo as string,
    }));

  const heroTitle = settings?.heroTitle ?? fallbackHeroTitle;
  const heroHighlight = settings?.heroHighlight ?? fallbackHeroHighlight;
  const heroSubtitle = settings?.heroSubtitle ?? fallbackHeroSubtitle;

  const showCategories = isBool(settings?.showCategories) ? settings.showCategories : (home?.sections?.categories ?? true);

  const showLatestGuides = isBool(settings?.showLatestGuides)
    ? settings.showLatestGuides
    : (home?.sections?.latestGuides ?? true);

  const showTopBrands = isBool(settings?.showTopBrands) ? settings.showTopBrands : (home?.sections?.topBrands ?? true);

  const heroCtas = (() => {
    const parsed = parseHeroCtas(settings?.heroCtas);
    if (parsed.length) return parsed;
    return fallbackHeroCtas;
  })();

  const categoryTiles = (() => {
    const parsed = parseCategoryTiles(settings?.categoryTiles);
    if (parsed.length) return parsed;
    return fallbackCategoryTiles;
  })();

  const topBrands = (() => {
    const parsed = parseTopBrands(settings?.topBrands);
    if (parsed.length) return parsed;
    return fallbackTopBrands;
  })();

  const latestArticles = showLatestGuides
    ? await prisma.page.findMany({
        where: {
          published: true,
          kind: { in: ["GUIDE", "ARTICLE", "COMPARATIF"] },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true,
          slug: true,
          title: true,
          intro: true,
          thumbnailUrl: true,
          thumbnail: { select: { publicUrl: true } },
          createdAt: true,
          updatedAt: true,
        },
      })
    : [];

  const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

  const homeJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site}/#organization`,
        name: settings?.name ?? siteConfig.name,
        url: site,
      },
      {
        "@type": "WebSite",
        "@id": `${site}/#website`,
        url: site,
        name: settings?.name ?? siteConfig.name,
        publisher: { "@id": `${site}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${site}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "WebPage",
        "@id": `${site}/#homepage`,
        url: site,
        name: settings?.name ?? siteConfig.name,
        description: heroSubtitle,
        isPartOf: { "@id": `${site}/#website` },
        about: [
          ...(showCategories
            ? categoryTiles.map((c) => ({
                "@type": "Thing",
                name: c.title,
                url: `${site}/c/${c.slug}`,
              }))
            : []),
          ...(showTopBrands
            ? topBrands.map((b) => ({
                "@type": "Brand",
                name: b.name,
                url: `${site}/marques/${b.slug}`,
              }))
            : []),
        ],
      },
      ...(showCategories && categoryTiles.length
        ? [
            {
              "@type": "ItemList",
              "@id": `${site}/#popular-categories`,
              name: "Catégories populaires",
              itemListOrder: "https://schema.org/ItemListOrderAscending",
              numberOfItems: categoryTiles.length,
              itemListElement: categoryTiles.map((c, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: c.title,
                url: `${site}/c/${c.slug}`,
              })),
            },
          ]
        : []),
      ...(showTopBrands && topBrands.length
        ? [
            {
              "@type": "ItemList",
              "@id": `${site}/#top-brands`,
              name: "Top marques",
              itemListOrder: "https://schema.org/ItemListOrderAscending",
              numberOfItems: topBrands.length,
              itemListElement: topBrands.map((b, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: b.name,
                url: `${site}/marques/${b.slug}`,
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <main className="pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />

      <section className="relative overflow-hidden py-14 md:py-20 text-center bg-gradient-to-b from-white to-muted/60">
        <div className="container-page relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-ink tracking-tight">
            {heroTitle.split(heroHighlight).length > 1 ? (
              <>
                {heroTitle.split(heroHighlight)[0]}
                <span className="text-brand-600">{heroHighlight}</span>
                {heroTitle.split(heroHighlight).slice(1).join(heroHighlight)}
              </>
            ) : (
              <>
                {heroTitle} <span className="text-brand-600">{heroHighlight}</span>
              </>
            )}
          </h1>

          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 max-w-[28rem] sm:max-w-2xl mx-auto px-2">
            {heroSubtitle}
          </p>

          {heroCtas.length ? (
            <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 px-3 sm:px-0">
              {heroCtas.map((cta) => (
                <Link key={`${cta.href}-${cta.label}`} href={cta.href} className={`${ctaClass(cta.variant)} w-full sm:w-auto`}>
                  {cta.label}
                  {cta.variant === "primary" || !cta.variant ? <ArrowRight className="h-4 w-4" /> : null}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {showCategories ? (
        <section id="categories" className="mt-12 md:mt-16 container-page">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-ink">Catégories populaires</h2>
            <p className="text-sm text-slate-600 max-w-2xl">
              Des pages catégories pensées pour la performance : prix à jour, filtres utiles et contenu d’aide au choix.
            </p>
          </div>

          {categoryTiles.length ? (
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {categoryTiles.map((c) => (
                <li key={c.slug} className="group">
                  <Link
                    href={`/c/${c.slug}`}
                    className="block card overflow-hidden hover:shadow-card transition"
                    aria-label={`Voir la catégorie ${c.title}`}
                  >
                    <div className="relative aspect-[16/9] w-full bg-muted">
                      <img src={c.img} alt={c.title} className="h-full w-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
                    </div>

                    <div className="p-5">
                      <h3 className="text-base font-semibold text-ink">{c.title}</h3>
                      <p className="mt-1 text-sm text-slate-600 line-clamp-2">{c.desc}</p>

                      <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                        {c.cta}
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-2xl border border-ring bg-white p-5 text-sm text-slate-600">
              Aucune vignette configurée. Va dans <strong>Admin → Design</strong> pour définir les catégories de la homepage.
            </div>
          )}
        </section>
      ) : null}

      {showLatestGuides ? (
        <section className="mt-14 md:mt-18 container-page">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-ink">Derniers articles</h2>
            <Link href="/pages" className="text-sm underline text-brand-600 hover:text-brand-700">
              Voir tout
            </Link>
          </div>

          {latestArticles.length ? (
            <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestArticles.map((p) => {
                const thumb = p.thumbnail?.publicUrl || p.thumbnailUrl || null;
                const date = p.updatedAt ?? p.createdAt;

                return (
                  <li key={p.id} className="rounded-2xl border border-ring bg-white hover:shadow-card transition">
                    <Link href={`/pages/${p.slug}`} className="block">
                      <div className="aspect-[16/9] w-full overflow-hidden rounded-t-2xl bg-muted">
                        {thumb ? (
                          <img src={thumb} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-muted to-white" />
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="text-base font-semibold text-ink line-clamp-2">{p.title}</h3>
                        {p.intro ? <p className="text-sm text-slate-600 mt-1 line-clamp-2">{p.intro}</p> : null}
                        <div className="mt-2 text-xs text-slate-500">Mis à jour le {fmt.format(date)}</div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl border border-ring bg-white p-5 text-sm text-slate-600">
              Aucun contenu publié pour le moment.
            </div>
          )}
        </section>
      ) : null}

      {showTopBrands ? (
        <section className="mt-14 md:mt-18 container-page">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-ink">Top marques</h2>
            <Link href="/marques" className="text-sm underline text-brand-600 hover:text-brand-700">
              Voir tout l’annuaire
            </Link>
          </div>

          {topBrands.length ? (
            <ul className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              {topBrands.map((b) => (
                <li key={b.slug} className="group">
                  <Link
                    href={`/marques/${b.slug}`}
                    className="block rounded-2xl border border-ring bg-white p-4 sm:p-5 hover:shadow-card transition"
                    aria-label={`Voir la marque ${b.name}`}
                    title={b.name}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted/40 flex items-center justify-center">
                      <img
                        src={b.logo}
                        alt={b.name}
                        className="max-h-14 sm:max-h-16 w-auto object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="mt-2 text-center text-sm font-medium text-ink group-hover:underline">{b.name}</div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl border border-ring bg-white p-5 text-sm text-slate-600">
              Aucune marque configurée. Va dans <strong>Admin → Design</strong> pour définir les top marques.
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}