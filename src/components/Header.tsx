"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useSession, signIn, signOut } from "next-auth/react";
import type { Role } from "@prisma/client";

const nav = [
  { href: "/c/skis-all-mountain", label: "Skis All-Mountain" },
  { href: "/c/skis-freeride", label: "Skis Freeride" },
  { href: "/c/skis-rando", label: "Skis Rando" },
  { href: "/c/fixations", label: "Fixations" },
  { href: "/c/chaussures", label: "Chaussures" },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const role: Role = ((session?.user as { role?: Role })?.role) ?? "USER";
  const isAdmin = role === "ADMIN";
  const profileHref = isAdmin ? "/admin" : "/compte";
  const profileLabel = isAdmin ? "Admin" : "Mon profil";

  // petites initiales pour avatar fallback
  const initials = (() => {
    const n = session?.user?.name || session?.user?.email || "";
    return n
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("");
  })();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-ring">
      {/* Barre colorée */}
      <div className="h-1 w-full brand-gradient" />

      <div className="bg-bg/80 supports-[backdrop-filter]:backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
          <Link href="/" className="shrink-0" aria-label="Accueil">
            <Logo />
          </Link>

          {/* Search */}
          <form action="/search" className="flex-1">
            <div className="relative">
              <input
                name="q"
                placeholder="Rechercher un ski, modèle ou marque…"
                className="w-full rounded-xl bg-white/95 text-ink border border-ring px-4 py-2 pr-28 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                aria-label="Rechercher"
                className="absolute right-1 top-1 rounded-lg px-3 py-1.5 bg-sec-500 hover:bg-sec-600 text-white text-sm"
              >
                Rechercher
              </button>
            </div>
          </form>

          {/* Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((n) => {
              const active = pathname?.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`px-3 py-2 text-sm rounded-lg transition ${
                    active
                      ? "bg-brand-500/20 text-white border border-white/10"
                      : "text-brand-200 hover:text-white hover:bg-brand-500/15"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth zone */}
          <div className="ml-auto flex items-center gap-2">
            {status === "loading" ? (
              <div className="h-9 w-24 rounded-lg bg-muted animate-pulse" />
            ) : session ? (
              <>
                <Link
                  href={profileHref}
                  className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-ring bg-white px-3 py-2 text-sm text-ink hover:bg-muted"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-semibold">
                    {initials || "ME"}
                  </span>
                  <span className="max-w-[12ch] truncate">
                    {profileLabel}
                  </span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="btn-outline"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <button onClick={() => signIn()} className="btn">
                Se connecter
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
