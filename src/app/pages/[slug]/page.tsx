// src/app/pages/[slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import type { PageKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { getCurrentSiteId, getCurrentSiteUrl } from "@/lib/currentSite";
import ShareButtons from "@/components/ShareButtons";
import RelatedArticles from "@/components/RelatedArticles";
import AdsenseUnit from "@/components/ads/AdsenseUnit";
import { injectInlineAdMarker, splitHtmlByMarker } from "@/lib/ads";

export const revalidate = 300;

type Params = { slug: string };

function kindLabel(k?: PageKind) {
  if (k === "GUIDE") return "Guide";
  if (k === "COMPARATIF") return "Comparatif";
  return "Article";
}

function stripTags(input: string) {
  return input.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

type TocItem = { id: string; text: string; level: 2 | 3 };

function addHeadingIdsAndBuildToc(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Map<string, number>();

  const out = html.replace(/<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/gi, (full, tag, attrs, inner) => {
    const level = tag.toLowerCase() === "h2" ? 2 : 3;
    const text = stripTags(String(inner));
    if (!text) return full;

    let id = slugify(text);
    if (!id) return full;

    const n = (used.get(id) ?? 0) + 1;
    used.set(id, n);
    if (n > 1) id = `${id}-${n}`;

    toc.push({ id, text, level });

    if (/\sid\s*=\s*["'][^"']+["']/.test(attrs)) return full;

    return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
  });

  return { html: out, toc };
}

function formatDateISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function readingTime(html: string) {
  const words = stripTags(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function adBox(children: React.ReactNode) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
      <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Publicité
      </div>
      {children}
    </div>
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await prisma.page.findFirst({
    where: { slug: params.slug, published: true },
    select: {
      title: true,
      intro: true,
      metaTitle: true,
      metaDescription: true,
      slug: true,
      bannerUrl: true,
      banner: { select: { publicUrl: true, width: true, height: true } },
      thumbnail: { select: { publicUrl: true, width: true, height: true } },
      thumbnailUrl: true,
    },
  });

  if (!p) return { title: "Page introuvable" };

  const site = await getCurrentSiteUrl();
  const url = `${site}/pages/${p.slug}`;

  const ogCandidate = p.banner?.publicUrl
    ? { url: p.banner.publicUrl, width: p.banner.width ?? undefined, height: p.banner.height ?? undefined }
    : p.bannerUrl
      ? { url: p.bannerUrl }
      : p.thumbnail?.publicUrl
        ? { url: p.thumbnail.publicUrl, width: p.thumbnail.width ?? undefined, height: p.thumbnail.height ?? undefined }
        : p.thumbnailUrl
          ? { url: p.thumbnailUrl }
          : undefined;

  return {
    title: p.metaTitle ?? p.title,
    description: p.metaDescription ?? p.intro ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      title: p.metaTitle ?? p.title,
      description: p.metaDescription ?? p.intro ?? undefined,
      url,
      ...(ogCandidate ? { images: [ogCandidate] } : {}),
      type: "article",
    },
  };
}

export default async function PageDetail({ params }: { params: Params }) {
  const site = await getCurrentSiteUrl();
  const siteId = await getCurrentSiteId();

  const [page, adSettings] = await Promise.all([
    prisma.page.findFirst({
      where: { slug: params.slug, published: true },
      include: {
        author: { select: { id: true, name: true } },
        banner: { select: { publicUrl: true, width: true, height: true } },
        thumbnail: { select: { publicUrl: true, width: true, height: true } },
        category: { select: { id: true, name: true } },
        guideCategory: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.adSettings.findUnique({
      where: { siteId },
      select: {
        enabled: true,
        adsenseClient: true,
        slotPageTop: true,
        slotPageInline: true,
        slotPageSidebar: true,
        slotPageBottom: true,
      },
    }),
  ]);

  if (!page) return notFound();

  const canonicalUrl = `${site}/pages/${page.slug}`;

  const bannerSrc = page.banner?.publicUrl ?? page.bannerUrl ?? null;
  const thumbSrc = page.thumbnail?.publicUrl ?? page.thumbnailUrl ?? null;
  const heroSrc = bannerSrc ?? thumbSrc;

  const sanitized = sanitizeHtml(page.content || "");
  const estimatedReadingTime = readingTime(sanitized);
  const htmlWithAutoAd = injectInlineAdMarker(sanitized);
  const { html: htmlWithIds, toc } = addHeadingIdsAndBuildToc(htmlWithAutoAd);
  const { before: htmlBeforeAd, after: htmlAfterAd, hasMarker } = splitHtmlByMarker(htmlWithIds);

  const [lastArticle, latest3] = await Promise.all([
    prisma.page.findFirst({
      where: { published: true, NOT: { id: page.id } },
      orderBy: { createdAt: "desc" },
      select: {
        slug: true,
        title: true,
        intro: true,
        createdAt: true,
        thumbnail: { select: { publicUrl: true } },
        thumbnailUrl: true,
        guideCategory: { select: { name: true } },
      },
    }),
    prisma.page.findMany({
      where: { published: true, NOT: { id: page.id } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        slug: true,
        title: true,
        createdAt: true,
        thumbnail: { select: { publicUrl: true } },
        thumbnailUrl: true,
        guideCategory: { select: { name: true } },
      },
    }),
  ]);

  const imagesForLd: string[] = [];
  if (page.banner?.publicUrl) imagesForLd.push(page.banner.publicUrl);
  else if (page.bannerUrl) imagesForLd.push(page.bannerUrl);

  if (page.thumbnail?.publicUrl) imagesForLd.push(page.thumbnail.publicUrl);
  else if (page.thumbnailUrl) imagesForLd.push(page.thumbnailUrl);

  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Accueil", item: `${site}/` },
    { "@type": "ListItem", position: 2, name: "Guides", item: `${site}/pages` },
  ];

  if (page.guideCategory?.name) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: page.guideCategory.name,
      item: `${site}/pages#${page.guideCategory.slug}`,
    });
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 4,
      name: page.title,
      item: canonicalUrl,
    });
  } else {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: page.title,
      item: canonicalUrl,
    });
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumb`,
    itemListElement: breadcrumbItems,
  };

  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${canonicalUrl}#article`,
    headline: page.title,
    description: page.metaDescription ?? page.intro ?? undefined,
    url: canonicalUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    image: imagesForLd.length ? imagesForLd : undefined,
    datePublished: page.createdAt.toISOString(),
    dateModified: page.updatedAt.toISOString(),
    author: page.author?.name ? { "@type": "Person", name: page.author.name } : undefined,
    publisher: {
      "@type": "Organization",
      name: "Meilleur-ski",
      url: site,
    },
  };

  const hasAdsense = !!adSettings?.enabled && !!adSettings.adsenseClient;

  return (
    <section id="top" className="bg-slate-50/70 pb-12">
      <link rel="canonical" href={canonicalUrl} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }} />

      <div className="mx-auto max-w-6xl px-4 pt-5">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-slate-500 md:text-sm">
          <Link href="/" className="font-medium text-slate-600 hover:text-brand-700">
            Accueil
          </Link>
          <span>/</span>
          <Link href="/pages" className="font-medium text-slate-600 hover:text-brand-700">
            Guides
          </Link>
          {page.guideCategory?.name ? (
            <>
              <span>/</span>
              <Link href={`/pages#${page.guideCategory.slug}`} className="font-medium text-slate-600 hover:text-brand-700">
                {page.guideCategory.name}
              </Link>
            </>
          ) : null}
          <span>/</span>
          <span className="line-clamp-1 font-semibold text-slate-800">{page.title}</span>
        </nav>

        <header className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="p-5 md:p-7 lg:col-span-7 lg:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-200">
                  {kindLabel(page.kind)}
                </span>

                {page.guideCategory?.name ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    {page.guideCategory.name}
                  </span>
                ) : null}

                {page.category?.name ? (
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                    {page.category.name}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
                {page.title}
              </h1>

              {page.intro ? (
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
                  {page.intro}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                <span>
                  Publié le{" "}
                  <time dateTime={page.createdAt.toISOString()} className="font-semibold text-slate-800">
                    {formatDateISO(page.createdAt)}
                  </time>
                </span>
                <span className="hidden text-slate-300 sm:inline">·</span>
                <span>{estimatedReadingTime} min de lecture</span>
                {page.author?.name ? (
                  <>
                    <span className="hidden text-slate-300 sm:inline">·</span>
                    <span>
                      par <span className="font-semibold text-slate-800">{page.author.name}</span>
                    </span>
                  </>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <ShareButtons title={page.title} url={canonicalUrl} />

                {toc.length > 0 ? (
                  <a
                    href="#sommaire-mobile"
                    className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 lg:hidden"
                  >
                    Voir le sommaire
                  </a>
                ) : null}

                {toc.length > 0 ? (
                  <a
                    href="#sommaire"
                    className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 lg:inline-flex"
                  >
                    Aller au sommaire
                  </a>
                ) : null}
              </div>
            </div>

            <div className="bg-slate-100 lg:col-span-5">
              {heroSrc ? (
                <div className="h-full min-h-[220px] lg:min-h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroSrc} alt={page.title} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-full min-h-[220px] items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,.18),transparent_35%),linear-gradient(135deg,#f8fafc,#e2e8f0)] p-10 text-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                      Guide expert
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-900">Meilleur Ski</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {hasAdsense && adSettings.slotPageTop ? (
          <section className="mt-6">
            {adBox(<AdsenseUnit client={adSettings.adsenseClient!} slot={adSettings.slotPageTop} />)}
          </section>
        ) : null}

        {toc.length > 0 ? (
          <details
            id="sommaire-mobile"
            className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm lg:hidden"
          >
            <summary className="cursor-pointer list-none p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                    Navigation
                  </p>
                  <h2 className="mt-1 text-base font-black text-slate-950">
                    Sommaire
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  Ouvrir
                </span>
              </div>
            </summary>

            <nav className="border-t border-slate-100 px-5 pb-5">
              <ul className="space-y-1.5 text-sm">
                {toc.map((item) => (
                  <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
                    <a
                      href={`#${item.id}`}
                      className={`block rounded-xl px-3 py-2 leading-snug transition hover:bg-brand-50 hover:text-brand-700 ${
                        item.level === 3
                          ? "text-sm text-slate-500"
                          : "font-semibold text-slate-800"
                      }`}
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </details>
        ) : null}

        <div className="mt-8 grid grid-cols-1 items-start gap-7 lg:grid-cols-12">
          <article className="lg:col-span-8">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="p-5 md:p-8 lg:p-10">
                <div className="prose max-w-none prose-headings:scroll-mt-28">
                  <div dangerouslySetInnerHTML={{ __html: htmlBeforeAd }} />

                  {hasAdsense && adSettings.slotPageInline && hasMarker ? (
                    <div className="not-prose my-8">
                      {adBox(<AdsenseUnit client={adSettings.adsenseClient!} slot={adSettings.slotPageInline} />)}
                    </div>
                  ) : null}

                  {htmlAfterAd ? <div dangerouslySetInnerHTML={{ __html: htmlAfterAd }} /> : null}
                </div>
              </div>
            </div>

            {hasAdsense && adSettings.slotPageInline && !hasMarker ? (
              <section className="my-7">
                {adBox(<AdsenseUnit client={adSettings.adsenseClient!} slot={adSettings.slotPageInline} />)}
              </section>
            ) : null}

            <section className="mt-10">
              <RelatedArticles currentSlug={page.slug} max={6} />
            </section>

            {latest3.length > 0 ? (
              <section className="mt-12">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                    Nouveautés
                  </p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                    Derniers articles
                  </h2>
                </div>

                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {latest3.map((a) => {
                    const img = a.thumbnail?.publicUrl ?? a.thumbnailUrl;

                    return (
                      <li
                        key={a.id}
                        className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-card"
                      >
                        <Link href={`/pages/${a.slug}`} className="block">
                          <div className="aspect-[16/10] bg-slate-100">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={img}
                                alt={a.title}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : null}
                          </div>
                          <div className="p-4">
                            {a.guideCategory?.name ? (
                              <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                                {a.guideCategory.name}
                              </div>
                            ) : null}
                            <div className="text-xs text-slate-500">{formatDateISO(a.createdAt)}</div>
                            <h3 className="mt-1 line-clamp-2 text-sm font-bold text-slate-950 group-hover:text-brand-700">
                              {a.title}
                            </h3>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm font-bold text-slate-950">Article utile ?</p>
                <p className="text-sm text-slate-600">Partagez ce guide à d’autres passionnés de ski.</p>
              </div>
              <ShareButtons title={page.title} url={canonicalUrl} />
            </div>

            {hasAdsense && adSettings.slotPageBottom ? (
              <section className="mt-7">
                {adBox(<AdsenseUnit client={adSettings.adsenseClient!} slot={adSettings.slotPageBottom} />)}
              </section>
            ) : null}
          </article>

          <aside className="hidden space-y-5 lg:sticky lg:top-28 lg:col-span-4 lg:block">
            {hasAdsense && adSettings.slotPageSidebar ? (
              <section>
                {adBox(<AdsenseUnit client={adSettings.adsenseClient!} slot={adSettings.slotPageSidebar} />)}
              </section>
            ) : null}

            {toc.length > 0 ? (
              <div id="sommaire" className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                        Navigation
                      </p>
                      <h2 className="mt-1 text-base font-black text-slate-950">Sommaire</h2>
                    </div>

                    <a href="#top" className="text-xs font-semibold text-slate-500 hover:text-brand-700">
                      Haut ↑
                    </a>
                  </div>

                  <nav className="mt-4 max-h-[380px] overflow-y-auto pr-1">
                    <ul className="space-y-1.5 text-sm">
                      {toc.map((item) => (
                        <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
                          <a
                            href={`#${item.id}`}
                            className={`block rounded-xl px-3 py-2 leading-snug transition hover:bg-brand-50 hover:text-brand-700 ${
                              item.level === 3
                                ? "text-sm text-slate-500"
                                : "font-semibold text-slate-800"
                            }`}
                          >
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </div>
            ) : null}

            {lastArticle ? (
              <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <Link href={`/pages/${lastArticle.slug}`} className="group block">
                  <div className="aspect-[16/10] bg-slate-100">
                    {lastArticle.thumbnail?.publicUrl || lastArticle.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={lastArticle.thumbnail?.publicUrl ?? lastArticle.thumbnailUrl!}
                        alt={lastArticle.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                  </div>

                  <div className="p-5">
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
                      À lire aussi
                    </div>

                    {lastArticle.guideCategory?.name ? (
                      <div className="mt-2 text-xs font-semibold text-slate-500">
                        {lastArticle.guideCategory.name}
                      </div>
                    ) : null}

                    <h3 className="mt-2 text-base font-black leading-snug text-slate-950 group-hover:text-brand-700">
                      {lastArticle.title}
                    </h3>

                    {lastArticle.intro ? (
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                        {lastArticle.intro}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}