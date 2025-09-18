import { prisma } from "../../lib/prisma";

export async function GET() {
  const base = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "achat-ski.vercel.app"}`;
  const products = await prisma.product.findMany({ select: { slug: true, updatedAt: false, createdAt: true } });
  const urls = products.map(p => {
    const lastmod = (p as any).createdAt?.toISOString?.() ?? new Date().toISOString(); // fallback
    return `<url><loc>${base}/p/${p.slug}</loc><lastmod>${lastmod}</lastmod></url>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc></url>
  ${urls}
</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
