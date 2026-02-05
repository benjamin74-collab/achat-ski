// src/middleware.ts
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

type TokenWithSite = {
  role?: string;
  siteId?: string | null;
};

function getHost(req: NextRequest) {
  // ex: "meilleur-robot.com:3000" -> "meilleur-robot.com"
  return (req.headers.get("host") || "").toLowerCase().split(":")[0];
}

/**
 * Déduit le siteSlug depuis le host.
 * - Priorité 1 : mapping explicite via env JSON
 *   ex: SITE_HOST_MAP='{"meilleur-ski.com":"meilleur-ski","www.meilleur-ski.com":"meilleur-ski","meilleur-robot.com":"meilleur-robot"}'
 * - Fallback : heuristique simple (contient "meilleur-robot" / "meilleur-ski")
 */
function getSiteSlugFromHost(host: string): string {
  const raw = process.env.SITE_HOST_MAP;
  if (raw) {
    try {
      const map = JSON.parse(raw) as Record<string, string>;
      const found = map[host];
      if (found) return found;
    } catch {
      // ignore JSON parse error
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

    // Pas connecté -> login
    if (!token) {
      const url = new URL("/api/auth/signin", req.url);
      url.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Doit être admin
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // ✅ Check multi-site
    const host = getHost(req);
    const currentSite = getSiteSlugFromHost(host);

    // token.siteId null => super-admin (accès à tous sites)
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
