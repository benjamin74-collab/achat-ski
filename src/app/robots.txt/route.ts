// src/app/robots.txt/route.ts
export const runtime = "edge";

export function GET() {
  const body = `
User-agent: *
Allow: /
Disallow: /admin/

Sitemap: https://achat-ski.vercel.app/sitemap.xml
  `.trim();

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

