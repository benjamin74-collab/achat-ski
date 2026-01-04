// src/app/pages/page.tsx
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

function getSiteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/+$/, "");
  return "https://meilleur-ski.com";
}

export default async function PagesIndex() {
  const site = getSiteUrl();
  const canonicalUrl = `${site}/pages`;

  const pages = await prisma.page.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      intro: true,
      thumbnailUrl: true,
      createdAt: true,
    },
  });

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
    "@type": "ItemList",
    name: "Guides & articles",
    numberOfItems: pages.length,
    itemListElement: pages.slice(0, 200).map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${site}/pages/${p.slug}`,
      item: {
        "@type": "BlogPosting",
        headline: p.title,
        url: `${site}/pages/${p.slug}`,
        ...(p.intro ? { description: p.intro } : {}),
        datePublished: p.createdAt.toISOString(),
        ...(p.thumbnailUrl ? { image: [p.thumbnailUrl] } : {}),
      },
    })),
  };

  return (
    <main className="container-page py-8">
      <link rel="canonical" href={canonicalUrl} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Articles & Guides</h1>
        <Link href="/" className="text-sm underline text-brand-600">
          Accueil
        </Link>
      </div>

      <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((p) => (
          <li key={p.id} className="rounded-2xl border border-ring bg-white hover:shadow-card transition">
            <Link href={`/pages/${p.slug}`} className="block">
              <div className="aspect-[16/9] w-full overflow-hidden rounded-t-2xl bg-muted">
                {p.thumbnailUrl ? (
                  <img src={p.thumbnailUrl} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
                ) : null}
              </div>
              <div className="p-4">
                <h2 className="text-base font-semibold">{p.title}</h2>
                {p.intro ? <p className="text-sm text-slate-600 mt-1 line-clamp-2">{p.intro}</p> : null}
                <div className="mt-2 text-xs text-slate-500">Publié le {p.createdAt.toISOString().slice(0, 10)}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
