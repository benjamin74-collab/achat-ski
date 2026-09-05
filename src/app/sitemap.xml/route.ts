// src/app/sitemap.xml/route.ts

import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/config/site";

export const runtime = "nodejs";

function toIso(d: Date | null | undefined) {
  return d ? d.toISOString() : undefined;
}

function escXml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET(req: Request) {
  const siteConfig = getSiteConfig();

  const origin = new URL(req.url).origin;

  const base =
    siteConfig.domain?.replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    origin;

  /**
   * ID du site courant.
   *
   * On accepte siteId ou id pour rester compatible avec
   * la structure actuelle/future de getSiteConfig().
   *
   * Si aucun identifiant de site n'est disponible,
   * le sitemap continuera à fonctionner avec les critères
   * globaux Product + Offer.
   */
  const siteId =
    (siteConfig as { siteId?: string; id?: string }).siteId ||
    (siteConfig as { siteId?: string; id?: string }).id ||
    process.env.SITE_ID ||
    process.env.NEXT_PUBLIC_SITE_ID;

  const [pages, categories, brands, products] = await Promise.all([
    /**
     * Pages éditoriales publiées
     */
    prisma.page.findMany({
      where: {
        published: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),

    /**
     * Catégories publiées
     */
    prisma.category.findMany({
      where: {
        published: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: [
        { parentId: "asc" },
        { order: "asc" },
        { name: "asc" },
      ],
    }),

    /**
     * Marques actives
     */
    prisma.brand.findMany({
      where: {
        active: true,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    /**
     * Produits indexables
     *
     * Un produit doit :
     * - être publié
     * - être actif
     * - avoir au moins une offre active et non archivée
     *
     * Si le siteId est disponible :
     * - le produit doit également être publié et actif
     *   pour le site courant via SiteProduct
     * - l'offre doit appartenir à un programme d'affiliation
     *   du site courant lorsqu'un programme est associé
     */
    prisma.product.findMany({
      where: {
        published: true,
        active: true,

        ...(siteId
          ? {
              sites: {
                some: {
                  siteId,
                  published: true,
                  active: true,
                  archivedAt: null,
                },
              },
            }
          : {}),

        offers: {
		  some: {
			active: true,
			archivedAt: null,
		  },
		},
      },

      select: {
        slug: true,
        updatedAt: true,
      },

      orderBy: {
        updatedAt: "desc",
      },

      take: 50000,
    }),
  ]);

  const urls: Array<{
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: string;
  }> = [
    {
      loc: `${base}/`,
      changefreq: "daily",
      priority: "1.0",
    },
    {
      loc: `${base}/marques`,
      changefreq: "weekly",
      priority: "0.6",
    },
    {
      loc: `${base}/pages`,
      changefreq: "weekly",
      priority: "0.6",
    },
  ];

  /**
   * Pages éditoriales
   */
  for (const p of pages) {
    urls.push({
      loc: `${base}/pages/${encodeURIComponent(p.slug)}`,
      lastmod: toIso(p.updatedAt),
      changefreq: "monthly",
      priority: "0.7",
    });
  }

  /**
   * Catégories
   */
  for (const c of categories) {
    urls.push({
      loc: `${base}/${encodeURIComponent(c.slug)}`,
      lastmod: toIso(c.updatedAt),
      changefreq: "weekly",
      priority: "0.8",
    });
  }

  /**
   * Marques
   */
  for (const b of brands) {
    urls.push({
      loc: `${base}/marques/${encodeURIComponent(b.slug)}`,
      lastmod: toIso(b.updatedAt),
      changefreq: "monthly",
      priority: "0.6",
    });
  }

  /**
   * Produits
   */
  for (const p of products) {
    urls.push({
      loc: `${base}/p/${encodeURIComponent(p.slug)}`,
      lastmod: toIso(p.updatedAt),
      changefreq: "weekly",
      priority: "0.5",
    });
  }

  /**
   * Génération du XML
   */
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => {
    const loc = `<loc>${escXml(u.loc)}</loc>`;

    const lastmod = u.lastmod
      ? `<lastmod>${escXml(u.lastmod)}</lastmod>`
      : "";

    const changefreq = u.changefreq
      ? `<changefreq>${u.changefreq}</changefreq>`
      : "";

    const priority = u.priority
      ? `<priority>${u.priority}</priority>`
      : "";

    return `  <url>${loc}${lastmod}${changefreq}${priority}</url>`;
  })
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}