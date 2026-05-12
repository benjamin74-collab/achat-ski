// src/app/page.tsx
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/config/site";

export const revalidate = 300;

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
  const home = siteConfig.home;

  const settings = await prisma.siteSettings.findUnique({
    where: { siteId: siteConfig.id },
  });

  const fallbackHeroTitle = home?.hero?.title ?? `Le comparateur ${siteConfig.name}`;
  const fallbackHeroHighlight = home?.hero?.highlight ?? siteConfig.name;
  const fallbackHeroSubtitle =
    home?.hero?.subtitle ?? "Comparez les meilleurs produits, marques et prix.";

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

  const heroTitle = settings?.heroTitle ?? fallbackHeroTitle;
  const heroHighlight = settings?.heroHighlight ?? fallbackHeroHighlight;
  const heroSubtitle = settings?.heroSubtitle ?? fallbackHeroSubtitle;

  const showCategories = isBool(settings?.showCategories)
    ? settings.showCategories
    : (home?.sections?.categories ?? true);

  const showLatestGuides = isBool(settings?.showLatestGuides)
    ? settings.showLatestGuides
    : (home?.sections?.latestGuides ?? true);

  const showTopBrands = isBool(settings?.showTopBrands)
    ? settings.showTopBrands
    : (home?.sections?.topBrands ?? true);

  const heroCtas = (() => {
    const parsed = parseHeroCtas(settings?.heroCtas);
    return parsed.length ? parsed : fallbackHeroCtas;
  })();

  const [homepageCategories, homepageBrands, latestArticles] = await Promise.all([
    showCategories
      ? prisma.category.findMany({
          where: {
            published: true,
            showOnHomepage: true,
          },
          orderBy: [{ order: "asc" }, { name: "asc" }],
          select: {
			  id: true,
			  slug: true,
			  name: true,
			  intro: true,
			  thumbnailUrl: true,
			  thumbnail: {
				select: {
				  publicUrl: true,
				},
			  },
			},
        })
      : Promise.resolve([]),

    showTopBrands
      ? prisma.brand.findMany({
          where: {
            active: true,
            showOnHomepage: true,
          },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            logo: { select: { publicUrl: true } },
          },
        })
      : Promise.resolve([]),

    showLatestGuides
      ? prisma.page.findMany({
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
      : Promise.resolve([]),
  ]);

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
          ...homepageCategories.map((c) => ({
            "@type": "Thing",
            name: c.name,
            url: `${site}/${c.slug}`,
          })),
          ...homepageBrands.map((b) => ({
            "@type": "Brand",
            name: b.name,
            url: `${site}/marques/${b.slug}`,
          })),
        ],
      },
    ],
  };

  return (
    <main className="pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />

      <section className="relative overflow-hidden bg-gradient-to-b from-white to-muted/60 py-14 text-center md:py-20">
        <div className="container-page relative z-10">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl md:text-5xl">
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

          <p className="mx-auto mt-3 max-w-[28rem] px-2 text-base text-slate-600 sm:mt-4 sm:max-w-2xl sm:text-lg">
            {heroSubtitle}
          </p>

          {heroCtas.length ? (
            <div className="mt-7 flex flex-col items-center justify-center gap-3 px-3 sm:mt-9 sm:flex-row sm:px-0">
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
        <section id="categories" className="container-page mt-12 md:mt-16">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-xl font-bold text-ink sm:text-2xl">Catégories populaires</h2>
            <p className="max-w-2xl text-sm text-slate-600">
              Les catégories mises en avant depuis le backoffice.
            </p>
          </div>

          {homepageCategories.length ? (
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {homepageCategories.map((c) => (
                <li key={c.id} className="group">
                  <Link href={`/${c.slug}`} className="block card overflow-hidden transition hover:shadow-card">
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
					  {(() => {
						const image = c.thumbnail?.publicUrl || c.thumbnailUrl;

						return image ? (
						  <>
							<img
							  src={image}
							  alt={c.name}
							  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
							  loading="lazy"
							/>

							<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

							<div className="absolute bottom-3 left-3">
							  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-brand-700 shadow">
								{c.name}
							  </span>
							</div>
						  </>
						) : (
						  <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-50 via-white to-muted">
							<span className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-brand-700 ring-1 ring-brand-200">
							  {c.name}
							</span>
						  </div>
						);
					  })()}
					</div>

                    <div className="p-5">
                      <h3 className="text-base font-semibold text-ink">{c.name}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {c.intro || `Découvrez les produits de la catégorie ${c.name}.`}
                      </p>

                      <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                        Comparer les prix
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-2xl border border-ring bg-white p-5 text-sm text-slate-600">
              Aucune catégorie cochée en homepage.
            </div>
          )}
        </section>
      ) : null}

      {showLatestGuides ? (
        <section className="container-page mt-14 md:mt-18">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink sm:text-2xl">Derniers articles</h2>
            <Link href="/pages" className="text-sm text-brand-600 underline hover:text-brand-700">
              Voir tout
            </Link>
          </div>

          {latestArticles.length ? (
            <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {latestArticles.map((p) => {
                const thumb = p.thumbnail?.publicUrl || p.thumbnailUrl || null;
                const date = p.updatedAt ?? p.createdAt;

                return (
                  <li key={p.id} className="rounded-2xl border border-ring bg-white transition hover:shadow-card">
                    <Link href={`/pages/${p.slug}`} className="block">
                      <div className="aspect-[16/9] w-full overflow-hidden rounded-t-2xl bg-muted">
                        {thumb ? (
                          <img src={thumb} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-muted to-white" />
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="line-clamp-2 text-base font-semibold text-ink">{p.title}</h3>
                        {p.intro ? <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.intro}</p> : null}
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
        <section className="container-page mt-14 md:mt-18">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink sm:text-2xl">Top marques</h2>
            <Link href="/marques" className="text-sm text-brand-600 underline hover:text-brand-700">
              Voir tout l’annuaire
            </Link>
          </div>

          {homepageBrands.length ? (
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5">
              {homepageBrands.map((b) => {
                const logo = b.logo?.publicUrl || b.logoUrl || null;

                return (
                  <li key={b.id} className="group">
                    <Link
                      href={`/marques/${b.slug}`}
                      className="block rounded-2xl border border-ring bg-white p-4 transition hover:shadow-card sm:p-5"
                    >
                      <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl bg-muted/40">
                        {logo ? (
                          <img src={logo} alt={b.name} className="max-h-14 w-auto object-contain sm:max-h-16" loading="lazy" />
                        ) : (
                          <span className="text-lg font-black text-slate-400">{b.name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="mt-2 text-center text-sm font-medium text-ink group-hover:underline">{b.name}</div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl border border-ring bg-white p-5 text-sm text-slate-600">
              Aucune marque cochée en homepage.
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}