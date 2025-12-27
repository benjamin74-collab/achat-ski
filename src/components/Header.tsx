// src/components/Header.tsx
"use client";

import Link from "next/link";
<<<<<<< HEAD
import SearchBar from "@/components/SearchBar";
=======
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useSession, signIn, signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import { useEffect, useState } from "react";

type NavItem = {
  id: number;
  name: string;
  slug: string;
  children: NavItem[];
};

type SessionUser = {
  name?: string | null;
  email?: string | null;
  role?: Role;
  image?: string | null;      // standard NextAuth
  avatarUrl?: string | null;  // champ custom éventuel
};
>>>>>>> feat/brand-ui

export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const user = (session?.user as SessionUser | undefined) ?? undefined;
  const role: Role = user?.role ?? "USER";
  const isAdmin = role === "ADMIN";
  const profileHref = isAdmin ? "/admin" : "/me";
  const profileLabel = isAdmin ? "Admin" : "Mon profil";

  // Avatar: image OAuth > champ custom > null
  const avatarUrl = user?.image ?? user?.avatarUrl ?? null;

  // petites initiales pour avatar fallback
  const initials = (() => {
    const n = user?.name || user?.email || "";
    return n
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("");
  })();

  // --- Menu catégories dynamique ---
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/nav", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as NavItem[];
        if (!aborted) setNavItems(data);
      } catch {
        // silencieux
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  const topLevel = navItems;

  return (
<<<<<<< HEAD
    <header className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <a href="/" className="font-bold text-xl">Achat-Ski</a>
        <div className="flex-1 hidden md:block">
          <SearchBar />
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <a href="/c/skis-all-mountain/">Skis</a>
          <a href="/c/fixations/">Fixations</a>
          <a href="/c/chaussures/">Chaussures</a>
        </nav>
=======
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-ring">
      {/* Barre colorée */}
      <div className="h-1 w-full brand-gradient" />

      <div className="bg-bg/80 supports-[backdrop-filter]:backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          {/* Rangée 1 : logo à gauche, zone auth à droite */}
          <div className="flex items-center gap-4">
            <Link href="/" className="shrink-0" aria-label="Accueil">
              <Logo />
            </Link>

            {/* Espace flex pour pousser la zone auth à droite */}
            <div className="flex-1" />

            {/* Auth zone */}
            <div className="flex items-center gap-2">
              {status === "loading" ? (
                <div className="h-9 w-24 rounded-lg bg-muted animate-pulse" />
              ) : session ? (
                <>
                  <Link
                    href={profileHref}
                    className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-ring bg-white px-3 py-2 text-sm text-ink hover:bg-muted"
                  >
                    {/* Avatar ou initiales */}
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt={user?.name ?? "Avatar"}
                        className="h-6 w-6 rounded-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-semibold">
                        {initials || "ME"}
                      </span>
                    )}
                    <span className="max-w-[12ch] truncate">{profileLabel}</span>
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-outline">
                    Déconnexion
                  </button>
                </>
              ) : (
                <button onClick={() => signIn(undefined, { callbackUrl: "/admin" })} className="btn">
                  Se connecter
                </button>
              )}
            </div>
          </div>

          {/* Rangée 2 : Search en pleine largeur */}
          <form action="/search" className="mt-3">
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

          {/* Rangée 3 : Nav horizontale sous la recherche (scrollable en mobile) */}
          <nav className="mt-2 no-scrollbar -mx-2 overflow-x-auto">
            <div className="px-2 flex items-center gap-1">
              {/* Lien statique "Guides" */}
              <Link
                href="/pages"
                className={`px-3 py-2 text-sm rounded-lg transition ${
                  pathname?.startsWith("/pages")
                    ? "bg-brand-500/20 text-ink border border-brand-200"
                    : "text-ink/80 hover:text-ink hover:bg-brand-500/10"
                }`}
              >
                Guides
              </Link>

              {/* Liens catégories depuis la BDD */}
              {topLevel.map((n) => {
                const href = `/c/${n.slug}`;
                const active = pathname?.startsWith(href);
                return (
                  <Link
                    key={n.id}
                    href={href}
                    className={`px-3 py-2 text-sm rounded-lg transition ${
                      active
                        ? "bg-brand-500/20 text-ink border border-brand-200"
                        : "text-ink/80 hover:text-ink hover:bg-brand-500/10"
                    }`}
                  >
                    {n.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
>>>>>>> feat/brand-ui
      </div>
    </header>
  );
}

