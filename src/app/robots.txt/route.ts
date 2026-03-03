// src/app/robots.txt/route.ts
import { getSiteConfig } from "@/config/site";

export const runtime = "edge";

export function GET(req: Request) {
  const siteConfig = getSiteConfig();

  const origin = new URL(req.url).origin;
  const base =
    (siteConfig.domain?.replace(/\/+$/, "") ||
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
      origin);

  const body = `
User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${base}/sitemap.xml
  `.trim();

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}