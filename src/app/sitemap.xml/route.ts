import { prisma } from "../../lib/prisma";

export const runtime = "nodejs";         // exécuter côté Node
export const dynamic = "force-dynamic";  // pas de prerender
export const revalidate = 0;             // pas de cache ISR

type ProductRow = { slug: string; createdAt: Date };

export async function GET() {
  const base =
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "achat-ski.vercel.app"}`;

  try {
    const products: ProductRow[] = await prisma.product.findMany({
      select: { slug: true, createdAt: true },
      orderBy: { id: "desc" },
      take: 2000,
    });

    const urls = products
      .map(
        (p) =>
          `<url><loc>${base}/p/${p.slug}</loc><lastmod>${p.createdAt.toISOString()}</lastmod></url>`
      )
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc></url>
  ${urls}
</urlset>`;
    return new Response(xml, { headers: { "Content-Type": "application/xml" } });
  } catch {
    // Fallback minimal si la DB n'est pas accessible
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc></url>
</urlset>`;
    return new Response(xml, { headers: { "Content-Type": "application/xml" } });
  }
}
