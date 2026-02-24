// src/app/pages/[slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import ShareButtons from "@/components/ShareButtons";
import RelatedArticles from "@/components/RelatedArticles";
import Comments from "@/components/Comments";
import type { PageKind } from "@prisma/client";
import { AD_CONFIG } from "@/config/ads";

export const revalidate = 300;

type Params = { slug: string };

function getSiteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/+$/, "");
  return "https://meilleur-ski.com";
}

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

  // Capture <h2...>...</h2> and <h3...>...</h3>
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

    // If there's already an id, keep it; else inject ours
    if (/\sid\s*=\s*["'][^"']+["']/.test(attrs)) return full;

    return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
  });

  return { html: out, toc };
}

function formatDateISO(d: Date) {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
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

  const site = getSiteUrl();
  const url = `${site}/pages/${p.slug}`;

  const ogCandidate =
    p.banner?.publicUrl
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
  const site = getSiteUrl();

  const page = await prisma.page.findFirst({
    where: { slug: params.slug, published: true },
    include: {
      author: { select: { id: true, name: true } },
      banner: { select: { publicUrl: true, width: true, height: true } },
      thumbnail: { select: { publicUrl: true, width: true, height: true } },
      category: { select: { id: true, name: true } },
    },
  });

  if (!page) return notFound();

  const canonicalUrl = `${site}/pages/${page.slug}`;

  const bannerSrc = page.banner?.publicUrl ?? page.bannerUrl ?? null;
  const thumbSrc = page.thumbnail?.publicUrl ?? page.thumbnailUrl ?? null;
  const heroSrc = bannerSrc ?? thumbSrc;

  // HTML + TOC
  const sanitized = sanitizeHtml(page.content || "");
  const { html: htmlWithIds, toc } = addHeadingIdsAndBuildToc(sanitized);

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
      },
    }),
  ]);

  const imagesForLd: string[] = [];
  if (page.banner?.publicUrl) imagesForLd.push(page.banner.publicUrl);
  else if (page.bannerUrl) imagesForLd.push(page.bannerUrl);
  if (page.thumbnail?.publicUrl) imagesForLd.push(page.thumbnail.publicUrl);
  else if (page.thumbnailUrl) imagesForLd.push(page.thumbnailUrl);

  const crumbLabel = `${kindLabel(page.kind)}${page.category?.name ? ` ${page.category.name}` : ""}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${site}/` },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${site}/pages` },
      { "@type": "ListItem", position: 3, name: page.title, item: canonicalUrl },
    ],
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

  // Ads
  const adTop = AD_CONFIG.page_top;
  const adSidebar = AD_CONFIG.page_sidebar;
  const adInline = AD_CONFIG.page_inline;
  const adBottom = AD_CONFIG.page_bottom;

  // ⚠️ Le layout global contient déjà <main className="container-page py-6"> {children} </main>
  // Donc ici on évite un second container/main.
  return (
    <section className="py-2 md:py-4">
      <link rel="canonical" href={canonicalUrl} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }} />

      {/* Breadcrumbs plus “léger” */}
      <nav className="text-xs md:text-sm text-slate-600 flex flex-wrap items-center gap-2">
        <Link href="/" className="underline underline-offset-2">
          Accueil
        </Link>
        <span className="text-slate-400">/</span>
        <Link href="/pages" className="underline underline-offset-2">
          Guides
        </Link>
        <span className="text-slate-400">/</span>
        <span className="text-slate-700 font-medium line-clamp-1">{page.title}</span>
      </nav>

      {/* HERO */}
      <header className="mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-semibold rounded-full border px-2.5 py-1 bg-white">
                {kindLabel(page.kind)}
              </span>
              {page.category?.name ? (
                <span className="text-xs text-slate-600">{page.category.name}</span>
              ) : null}
            </div>

            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-900">
              {page.title}
            </h1>

            {page.intro ? (
              <p className="text-base md:text-lg text-slate-700 leading-relaxed">
                {page.intro}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span>
                Publié le <time dateTime={page.createdAt.toISOString()}>{formatDateISO(page.createdAt)}</time>
              </span>
              {page.author?.name ? (
                <>
                  <span className="text-slate-300">·</span>
                  <span>
                    par <span className="font-medium text-slate-800">{page.author.name}</span>
                  </span>
                </>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <ShareButtons title={page.title} url={canonicalUrl} />
              {toc.length > 0 ? (
                <a
                  href="#sommaire"
                  className="text-sm font-medium rounded-full border px-3 py-1.5 bg-white hover:shadow-card transition-shadow"
                >
                  Aller au sommaire
                </a>
              ) : null}
            </div>

            {adTop && (
              <section className="mt-2">
                <div className="rounded-2xl border bg-white overflow-hidden">
                  <a
                    href={adTop.linkUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:shadow-card transition-shadow"
                  >
                    {adTop.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={adTop.imageUrl}
                        alt={adTop.label ?? "Publicité"}
                        className="w-full h-28 md:h-36 object-cover"
                      />
                    ) : adTop.html ? (
                      <div dangerouslySetInnerHTML={{ __html: adTop.html }} />
                    ) : (
                      <div className="p-3 text-xs text-slate-500">
                        Emplacement publicité (haut de page)
                      </div>
                    )}
                  </a>
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-4">
            {heroSrc ? (
              <div className="overflow-hidden rounded-3xl border bg-muted shadow-card">
                <div className="aspect-[16/10]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroSrc}
                    alt={page.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border bg-muted p-6 text-sm text-slate-600">
                Illustration à venir
              </div>
            )}
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Article */}
        <article className="lg:col-span-8">
          <div className="rounded-3xl border bg-white shadow-card">
            <div className="p-5 md:p-8">
              <div
                className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-a:underline prose-a:underline-offset-2"
                dangerouslySetInnerHTML={{ __html: htmlWithIds }}
              />
            </div>
          </div>

          {adInline && (
            <section className="my-6">
              <div className="rounded-2xl border bg-white overflow-hidden">
                <a
                  href={adInline.linkUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:shadow-card transition-shadow"
                >
                  {adInline.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={adInline.imageUrl}
                      alt={adInline.label ?? "Publicité"}
                      className="w-full h-28 md:h-36 object-cover"
                    />
                  ) : adInline.html ? (
                    <div dangerouslySetInnerHTML={{ __html: adInline.html }} />
                  ) : (
                    <div className="p-3 text-xs text-slate-500">
                      Emplacement publicité (dans l’article)
                    </div>
                  )}
                </a>
              </div>
            </section>
          )}

          <section className="mt-10">
            <RelatedArticles currentSlug={page.slug} max={6} />
          </section>

          {latest3.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg md:text-xl font-semibold mb-3">Derniers articles</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {latest3.map((a) => (
                  <li key={a.id} className="rounded-2xl border bg-white overflow-hidden hover:shadow-card transition-shadow">
                    <Link href={`/pages/${a.slug}`} className="block">
                      <div className="aspect-[16/9] bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {a.thumbnail?.publicUrl || a.thumbnailUrl ? (
                          <img
                            src={a.thumbnail?.publicUrl ?? a.thumbnailUrl!}
                            alt={a.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : null}
                      </div>
                      <div className="p-3">
                        <div className="text-xs text-slate-500">{formatDateISO(a.createdAt)}</div>
                        <h3 className="mt-1 text-sm font-semibold line-clamp-2">{a.title}</h3>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10">
            <Comments pageId={page.id} />
          </section>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <ShareButtons title={page.title} url={canonicalUrl} />
            {adBottom && (
              <section className="w-full sm:w-auto sm:max-w-xs">
                <div className="rounded-2xl border bg-white overflow-hidden">
                  <a
                    href={adBottom.linkUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:shadow-card transition-shadow"
                  >
                    {adBottom.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={adBottom.imageUrl} alt={adBottom.label ?? "Publicité"} className="w-full h-24 object-cover" />
                    ) : adBottom.html ? (
                      <div dangerouslySetInnerHTML={{ __html: adBottom.html }} />
                    ) : (
                      <div className="p-3 text-xs text-slate-500">Emplacement publicité (bas)</div>
                    )}
                  </a>
                </div>
              </section>
            )}
          </div>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          {/* Sommaire */}
          {toc.length > 0 && (
            <div id="sommaire" className="rounded-3xl border bg-white shadow-card">
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold">Sommaire</h2>
                  <a href="#top" className="text-xs text-slate-500 underline underline-offset-2">
                    Haut de page
                  </a>
                </div>

                <nav className="mt-3">
                  <ul className="space-y-2 text-sm">
                    {toc.map((item) => (
                      <li key={item.id} className={item.level === 3 ? "pl-3" : ""}>
                        <a
                          href={`#${item.id}`}
                          className="text-slate-700 hover:text-slate-900 underline-offset-2 hover:underline"
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
          )}

          {/* Dernier article */}
          {lastArticle && (
            <div className="rounded-3xl border bg-white overflow-hidden shadow-card">
              <Link href={`/pages/${lastArticle.slug}`} className="block hover:shadow-card transition-shadow">
                <div className="aspect-[16/9] bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {lastArticle.thumbnail?.publicUrl || lastArticle.thumbnailUrl ? (
                    <img
                      src={lastArticle.thumbnail?.publicUrl ?? lastArticle.thumbnailUrl!}
                      alt={lastArticle.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </div>
                <div className="p-4">
                  <div className="text-xs text-slate-500">À lire aussi · {formatDateISO(lastArticle.createdAt)}</div>
                  <h3 className="mt-1 text-base font-semibold">{lastArticle.title}</h3>
                  {lastArticle.intro ? (
                    <p className="mt-1 text-sm text-slate-600 line-clamp-3">{lastArticle.intro}</p>
                  ) : null}
                </div>
              </Link>
            </div>
          )}

          {/* Pub sidebar */}
          {adSidebar && (
            <section>
              <div className="rounded-3xl border bg-white overflow-hidden shadow-card">
                <a
                  href={adSidebar.linkUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:shadow-card transition-shadow"
                >
                  {adSidebar.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={adSidebar.imageUrl} alt={adSidebar.label ?? "Publicité"} className="w-full h-48 object-cover" />
                  ) : adSidebar.html ? (
                    <div dangerouslySetInnerHTML={{ __html: adSidebar.html }} />
                  ) : (
                    <div className="p-4 text-xs text-slate-500">Emplacement publicité (sidebar)</div>
                  )}
                </a>
              </div>
            </section>
          )}
        </aside>
      </div>
    </section>
  );
}