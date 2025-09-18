export function GET() {
  return new Response(
`User-agent: *
Allow: /

Sitemap: https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "achat-ski.vercel.app"}/sitemap.xml
`, { headers: { "Content-Type": "text/plain" } }
  );
}
