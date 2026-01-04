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

  const html = sanitizeHtml(page.content || "");
  const canonicalUrl = `${site}/pages/${page.slug}`;

  const bannerSrc = page.banner?.publicUrl ?? page.bannerUrl ?? null;
  const thumbSrc = page.thumbnail?.publicUrl ?? page.thumbnailUrl ?? null;

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

  // Config pubs
  const adTop = AD_CONFIG.page_top;
  const adSidebar = AD_CONFIG.page_sidebar;
  const adInline = AD_CONFIG.page_inline;
  const adBottom = AD_CONFIG.page_bottom;

  return (
    <main className="container-page py-8">
      <link rel="canonical" href={canonicalUrl} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }} />

      <nav className="text-sm text-slate-600">
        <Link href="/" className="underline">
          Accueil
        </Link>
        {" · "}
        {page.category?.name ? <span>{crumbLabel}</span> : <Link href="/pages" className="underline">Articles</Link>}
      </nav>

      <header className="mt-4 space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold">{page.title}</h1>

        {page.intro && <p className="text-base md:text-lg text-slate-700">{page.intro}</p>}

        {(thumbSrc || bannerSrc) && (
          <div className="flex flex-col gap-3">
            {thumbSrc && (
              <div className="overflow-hidden rounded-2xl border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbSrc} alt={page.title} className="w-full h-48 md:h-60 object-cover" />
              </div>
            )}
            {bannerSrc && (
              <div className="overflow-hidden rounded-2xl border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bannerSrc} alt={page.title} className="w-full h-56 md:h-72 object-cover" />
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            Publié le {page.createdAt.toISOString().slice(0, 10)}
            {page.author?.name ? (
              <>
                {" "}
                · par <span className="font-medium">{page.author.name}</span>
              </>
            ) : null}
          </div>

          <ShareButtons title={page.title} url={canonicalUrl} />
        </div>

        {adTop && (
          <section className="mt-2">
            <a
              href={adTop.linkUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border bg-white overflow-hidden hover:shadow-card transition-shadow"
            >
              {adTop.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={adTop.imageUrl} alt={adTop.label ?? "Publicité"} className="w-full h-32 md:h-40 object-cover" />
              ) : adTop.html ? (
                <div dangerouslySetInnerHTML={{ __html: adTop.html }} />
              ) : adTop.label ? (
                <div className="p-3 text-sm text-slate-600">{adTop.label}</div>
              ) : null}
            </a>
          </section>
        )}
      </header>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <article className="prose max-w-none lg:col-span-8 card" dangerouslySetInnerHTML={{ __html: html }} />

        <aside className="lg:col-span-4 space-y-4">
          {lastArticle && (
            <div className="card overflow-hidden">
              <Link href={`/pages/${lastArticle.slug}`} className="block">
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
                  <div className="text-xs text-slate-500">Publié le {lastArticle.createdAt.toISOString().slice(0, 10)}</div>
                  <h3 className="mt-1 text-base font-semibold">{lastArticle.title}</h3>
                  {lastArticle.intro && <p className="mt-1 text-sm text-slate-600 line-clamp-2">{lastArticle.intro}</p>}
                </div>
              </Link>
            </div>
          )}

          {adSidebar && (
            <section>
              <a
                href={adSidebar.linkUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="card block overflow-hidden hover:shadow-card transition-shadow"
              >
                {adSidebar.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={adSidebar.imageUrl} alt={adSidebar.label ?? "Publicité"} className="w-full h-48 object-cover" />
                ) : adSidebar.html ? (
                  <div dangerouslySetInnerHTML={{ __html: adSidebar.html }} />
                ) : adSidebar.label ? (
                  <div className="p-3 text-sm text-slate-600">{adSidebar.label}</div>
                ) : null}
              </a>
            </section>
          )}
        </aside>
      </div>

      {adInline && (
        <section className="my-8">
          <a
            href={adInline.linkUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="block card overflow-hidden hover:shadow-card transition-shadow"
          >
            {adInline.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={adInline.imageUrl} alt={adInline.label ?? "Publicité"} className="w-full h-32 md:h-40 object-cover" />
            ) : adInline.html ? (
              <div dangerouslySetInnerHTML={{ __html: adInline.html }} />
            ) : adInline.label ? (
              <div className="p-3 text-sm text-slate-600">{adInline.label}</div>
            ) : null}
          </a>
        </section>
      )}

      <section className="mt-10">
        <RelatedArticles currentSlug={page.slug} max={6} />
      </section>

      {latest3.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-3">Derniers articles</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {latest3.map((a) => (
              <li key={a.id} className="card hover:shadow-card transition-shadow overflow-hidden">
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
                    <div className="text-xs text-slate-500">{a.createdAt.toISOString().slice(0, 10)}</div>
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
            <a
              href={adBottom.linkUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block card overflow-hidden hover:shadow-card transition-shadow"
            >
              {adBottom.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={adBottom.imageUrl} alt={adBottom.label ?? "Publicité"} className="w-full h-24 object-cover" />
              ) : adBottom.html ? (
                <div dangerouslySetInnerHTML={{ __html: adBottom.html }} />
              ) : adBottom.label ? (
                <div className="p-3 text-sm text-slate-600">{adBottom.label}</div>
              ) : null}
            </a>
          </section>
        )}
      </div>
    </main>
  );
}
