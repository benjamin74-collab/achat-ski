// src/middleware.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

type TokenWithSite = {
  role?: string;
  siteId?: string | null;
};

function getHost(req: NextRequest) {
  return (req.headers.get("host") || "").toLowerCase().split(":")[0];
}

function getSiteSlugFromHost(host: string): string {
  const raw = process.env.SITE_HOST_MAP;
  if (raw) {
    try {
      const map = JSON.parse(raw) as Record<string, string>;
      const found = map[host];
      if (found) return found;
    } catch {
      // ignore
    }
  }

  if (host.includes("meilleur-robot")) return "meilleur-robot";
  if (host.includes("meilleur-ski") || host.includes("achat-ski")) return "meilleur-ski";

  return process.env.DEFAULT_SITE_SLUG || "meilleur-ski";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const token = (await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })) as TokenWithSite | null;

    // ✅ Pas connecté -> redirige vers ta page custom /auth/signin avec URL complète (même domaine)
    if (!token) {
      const url = new URL("/auth/signin", req.url);
      url.searchParams.set("callbackUrl", req.nextUrl.href);
      return NextResponse.redirect(url);
    }

    // Doit être admin
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // ✅ Check multi-site (admin limité à son site)
    const host = getHost(req);
    const currentSite = getSiteSlugFromHost(host);
    const tokenSite = token.siteId ?? null;

    if (tokenSite && tokenSite !== currentSite) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
