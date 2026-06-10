import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getCurrentSiteUrl } from "@/lib/currentSite";
import BrandsDirectory from "@/components/brands/BrandsDirectory";

export const revalidate = 300;

export default async function BrandsDirectoryPage() {
  const site = await getCurrentSiteUrl();
  const canonicalUrl = `${site}/marques`;

  const brands = await prisma.brand.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      metaDescription: true,
      showOnHomepage: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
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
    name: "Annuaire des marques de ski et outdoor",
    numberOfItems: brands.length,
    itemListElement: brands.slice(0, 500).map((brand, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${site}/marques/${brand.slug}`,
      item: {
        "@type": "Brand",
        name: brand.name,
        url: `${site}/marques/${brand.slug}`,
        ...(brand.logoUrl ? { logo: brand.logoUrl } : {}),
      },
    })),
  };

  return (
    <div className="container-page py-8">
      <link rel="canonical" href={canonicalUrl} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <Breadcrumbs
        items={[
          { href: "/", label: "Accueil" },
          { label: "Marques" },
        ]}
      />

      <BrandsDirectory brands={brands} />
    </div>
  );
}