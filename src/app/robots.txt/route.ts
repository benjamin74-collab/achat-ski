import { NextResponse } from "next/server";

export const runtime = "edge";

export function GET() {
  const body = [
    "User-agent: *",
    "Disallow: /api/",
    "Disallow: /admin/",
    "Allow: /",
    `Sitemap: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://achat-ski.vercel.app"}/sitemap.xml`,
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
