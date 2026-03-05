import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getCurrentSiteUrl } from "@/lib/currentSite";

export const revalidate = 300;

function getSiteUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/+$/, "");
  return "https://meilleur-ski.com";
}

export default async function BrandsDirectoryPage() {
  const site = getCurrentSiteUrl();
  const canonicalUrl = `${site}/marques`;

  const brands = await prisma.brand.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, logoUrl: true },
  });

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${site}/` },
      { "@type": "ListItem", position: 2, name: "Marques", item: canonicalUrl },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Annuaire des marques",
    numberOfItems: brands.length,
    itemListElement: brands.slice(0, 500).map((b, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${site}/marques/${b.slug}`,
      item: {
        "@type": "Organization",
        name: b.name,
        url: `${site}/marques/${b.slug}`,
        ...(b.logoUrl ? { logo: b.logoUrl } : {}),
      },
    })),
  };

  return (
    <div className="container-page py-8">
      <link rel="canonical" href={canonicalUrl} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      <Breadcrumbs items={[{ href: "/", label: "Accueil" }, { label: "Marques" }]} />
      <h1 className="text-xl font-bold mb-4">Toutes les marques</h1>

      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {brands.map((b) => (
          <li key={b.id} className="rounded-xl border p-4 hover:bg-accent/30 flex flex-col items-center gap-2">
            {b.logoUrl ? <img src={b.logoUrl} alt="" width={60} height={60} /> : null}
            <Link href={`/marques/${b.slug}`} className="font-medium">
              {b.name}
            </Link>
          </li>
        ))}
        {brands.length === 0 && <li className="text-neutral-500">Aucune marque active</li>}
      </ul>
    </div>
  );
}
