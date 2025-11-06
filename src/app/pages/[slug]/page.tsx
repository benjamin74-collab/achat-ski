// src/app/pages/[slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import ShareButtons from "@/components/ShareButtons";
import AdSlot from "@/components/AdSlot";
import RelatedArticles from "@/components/RelatedArticles";
import Comments from "@/components/Comments";

export const revalidate = 300;

type Params = { slug: string };

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
      // nouveaux champs assets
      bannerAsset: { select: { url: true, width: true, height: true } },
      thumbnailAsset: { select: { url: true, width: true, height: true } },
      thumbnailUrl: true,
    },
  });
  if (!p) return { title: "Page introuvable" };

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://achat-ski.vercel.app";
  const url = `${site}/pages/${p.slug}`;

  // Choix d'image pour meta: priorité bannière asset > bannière URL > thumbnail asset > thumbnail URL
  const ogCandidate =
    p.bannerAsset?.url
      ? { url: p.bannerAsset.url, width: p.bannerAsset.width ?? undefined, height: p.bannerAsset.height ?? undefined }
      : p.bannerUrl
      ? { url: p.bannerUrl }
      : p.thumbnailAsset?.url
      ? { url: p.thumbnailAsset.url, width: p.thumbnailAsset.width ?? undefined, height: p.thumbnailAsset.height ?? undefined }
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
  const page = await prisma.page.findFirst({
    where: { slug: params.slug, published: true },
    include: {
      author: { select: { id: true, name: true } },
      // nouveaux champs assets
      bannerAsset: { select: { url: true, width: true, height: true } },
      thumbnailAsset: { select: { url: true, width: true, height: true } },
    },
  });

  if (!page) return notFound();

  const html = sanitizeHtml(page.content || "");
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://achat-ski.vercel.app";
  const canonicalUrl = `${site}/pages/${page.slug}`;

  // Image d'entête (affichage) : priorité bannière asset > bannière URL
  const bannerSrc = page.bannerAsset?.url ?? page.bannerUrl ?? null;

  // JSON-LD Article/BlogPosting
  const imagesForLd: string[] = [];
  if (page.bannerAsset?.url) imagesForLd.push(page.bannerAsset.url);
  else if (page.bannerUrl) imagesForLd.push(page.bannerUrl);
  if (page.thumbnailAsset?.url) imagesForLd.push(page.thumbnailAsset.url);
  else if (page.thumbnailUrl) imagesForLd.push(page.thumbnailUrl);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: page.title,
    description: page.metaDescription ?? page.intro ?? undefined,
    image: imagesForLd.length ? imagesForLd : undefined,
    datePublished: page.createdAt.toISOString(),
    dateModified: page.updatedAt.toISOString(),
    author: page.author?.name ? { "@type": "Person", name: page.author.name } : undefined,
    mainEntityOfPage: canonicalUrl,
  };

  return (
    <main className="container-page py-8">
      <link rel="canonical" href={canonicalUrl} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-sm text-slate-600">
        <Link href="/" className="underline">Accueil</Link> · <Link href="/pages" className="underline">Articles</Link>
      </nav>

      <header className="mt-3">
        <h1 className="text-2xl font-bold">{page.title}</h1>
        <div className="mt-1 text-sm text-slate-600">
          Publié le {page.createdAt.toISOString().slice(0,10)}
          {page.author?.name ? <> · par <span className="font-medium">{page.author.name}</span></> : null}
        </div>
        {bannerSrc ? (
          <div className="mt-4 overflow-hidden rounded-2xl border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerSrc} alt={page.title} className="w-full h-auto object-cover" />
          </div>
        ) : null}
      </header>

      {/* Share + Pub au-dessus du contenu */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <ShareButtons title={page.title} url={canonicalUrl} />
        <AdSlot id="page_top" />
      </div>

      {/* Contenu HTML sécurisé */}
      <article
        className="prose max-w-none mt-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Bloc pub inline */}
      <div className="my-6">
        <AdSlot id="page_inline" />
      </div>

      {/* A lire aussi... */}
      <section className="mt-10">
        <RelatedArticles currentSlug={page.slug} max={6} />
      </section>

      {/* Commentaires (connexion requise) */}
      <section className="mt-10">
        <Comments pageId={page.id} />
      </section>

      {/* Bas de page : share + pub */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <ShareButtons title={page.title} url={canonicalUrl} />
        <AdSlot id="page_bottom" />
      </div>
    </main>
  );
}
