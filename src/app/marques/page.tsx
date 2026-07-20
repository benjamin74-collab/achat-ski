import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  getCurrentSiteId,
  getCurrentSiteUrl,
} from "@/lib/currentSite";
import BrandsDirectory from "@/components/brands/BrandsDirectory";
import { resolveBrandsContent } from "@/lib/siteContent";

export const revalidate = 300;

export default async function BrandsDirectoryPage() {
  const [site, siteId] = await Promise.all([
    getCurrentSiteUrl(),
    getCurrentSiteId(),
  ]);

  const canonicalUrl = `${site}/marques`;

  const [brands, settings] = await Promise.all([
    prisma.brand.findMany({
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
    }),

    prisma.siteSettings.findUnique({
      where: { siteId },
      select: {
        contentSettings: true,
      },
    }),
  ]);

  const content = resolveBrandsContent(
    settings?.contentSettings,
  );

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: content.breadcrumbHomeLabel,
        item: `${site}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: content.breadcrumbBrandsLabel,
        item: canonicalUrl,
      },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: content.itemListName,
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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd),
        }}
      />

      <Breadcrumbs
        items={[
          {
            href: "/",
            label: content.breadcrumbHomeLabel,
          },
          {
            label: content.breadcrumbBrandsLabel,
          },
        ]}
      />

      <BrandsDirectory
        brands={brands}
        content={content}
      />
    </div>
  );
}