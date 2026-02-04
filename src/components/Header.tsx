// src/components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useSession, signIn } from "next-auth/react";
import type { Role } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";

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
  image?: string | null; // NextAuth
  avatarUrl?: string | null; // custom éventuel
};

function IconMenu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconClose(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function getSearchPlaceholder(siteId: string | undefined) {
  if (siteId === "meilleur-robot") return "Rechercher un robot, modèle ou marque…";
  return "Rechercher un ski, modèle ou marque…";
}

export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const user = (session?.user as SessionUser | undefined) ?? undefined;
  const role: Role = user?.role ?? "USER";
  const isAdmin = role === "ADMIN";
  const profileHref = isAdmin ? "/admin" : "/me";
  const profileLabel = isAdmin ? "Admin" : "Mon profil";

  const avatarUrl = user?.image ?? user?.avatarUrl ?? null;

  const initials = useMemo(() => {
    const n = user?.name || user?.email || "";
    return n
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("");
  }, [user?.name, user?.email]);

  // ✅ Placeholder dynamique
  const [searchPlaceholder, setSearchPlaceholder] = useState("Rechercher…");
  useEffect(() => {
    const siteId = document.documentElement.dataset.siteId;
    setSearchPlaceholder(getSearchPlaceholder(siteId));
  }, []);

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

  // --- Mobile menu ---
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Empêche le scroll quand drawer ouvert
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const navLinkClass = (active: boolean) =>
    `px-3 py-2 text-sm rounded-lg transition no-underline hover:no-underline ${
      active
        ? "bg-brand-500/20 text-ink border border-brand-200"
        : "text-ink/80 hover:text-ink hover:bg-brand-500/10"
    }`;

  // Accordéon mobile (parents ouverts)
  const [openIds, setOpenIds] = useState<Record<number, boolean>>({});
  useEffect(() => {
    if (!mobileOpen) setOpenIds({});
  }, [mobileOpen]);

  const toggleOpen = (id: number) => setOpenIds((s) => ({ ...s, [id]: !s[id] }));

  const isActivePath = (slug: string) => Boolean(pathname?.startsWith(`/${slug}`));

  return (
    <header className="sticky top-0 z-50 border-b border-ring clean-links">
      <div className="h-1 w-full brand-gradient" />

      <div className="bg-bg/80 supports-[backdrop-filter]:backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="shrink-0" aria-label="Accueil">
              <Logo />
            </Link>

            <div className="hidden lg:flex flex-1 justify-center">
              <form action="/search" className="w-full max-w-[640px]">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    name="q"
                    placeholder={searchPlaceholder}
                    className="w-full rounded-xl bg-white/95 text-ink border border-ring pl-10 pr-28 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    aria-label="Rechercher"
                    className="absolute right-1 top-1 rounded-lg px-3 py-1.5 bg-sec-500 hover:bg-sec-600 text-white text-sm"
                  >
                    Rechercher
                  </button>
                </div>
              </form>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {status === "loading" ? (
                <div className="h-9 w-24 rounded-lg bg-muted animate-pulse" />
              ) : session ? (
                <Link
                  href={profileHref}
                  className="inline-flex items-center gap-2 rounded-lg border border-ring bg-white px-3 py-2 text-sm text-ink hover:bg-muted"
                >
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
                  <span className="hidden sm:inline max-w-[12ch] truncate">{profileLabel}</span>
                </Link>
              ) : (
                <button onClick={() => signIn(undefined, { callbackUrl: "/admin" })} className="btn">
                  Se connecter
                </button>
              )}

              <button
                type="button"
                className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl border border-ring bg-white hover:bg-muted"
                aria-label="Ouvrir le menu"
                onClick={() => setMobileOpen(true)}
              >
                <IconMenu className="h-5 w-5 text-slate-800" />
              </button>
            </div>
          </div>

          <div className="mt-3 lg:hidden">
            <form action="/search">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  name="q"
                  placeholder={searchPlaceholder}
                  className="w-full rounded-xl bg-white/95 text-ink border border-ring pl-10 pr-28 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  aria-label="Rechercher"
                  className="absolute right-1 top-1 rounded-lg px-3 py-1.5 bg-sec-500 hover:bg-sec-600 text-white text-sm"
                >
                  Go
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-ring">
        <div className="mx-auto max-w-6xl px-4 py-2">
          <nav className="hidden lg:block">
            <div className="flex items-center gap-1">
              <Link href="/pages" className={navLinkClass(Boolean(pathname?.startsWith("/pages")))}>
                Guides
              </Link>

              {topLevel.map((n) => {
                const href = `/${n.slug}`;
                const active = Boolean(pathname?.startsWith(href));
                const hasChildren = (n.children?.length ?? 0) > 0;

                if (!hasChildren) {
                  return (
                    <Link key={n.id} href={href} className={navLinkClass(active)}>
                      {n.name}
                    </Link>
                  );
                }

                return (
                  <div key={n.id} className="relative group">
                    <Link href={href} className={navLinkClass(active)} aria-haspopup="menu">
                      {n.name}
                    </Link>

                    <div className="absolute left-0 top-full pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition">
                      <div className="w-[520px] rounded-2xl border border-ring bg-white shadow-card p-3">
                        <div className="grid grid-cols-2 gap-2">
                          {n.children.map((c) => (
                            <div key={c.id} className="rounded-xl border border-ring/60 p-3 hover:bg-muted/40">
                              <Link href={`/${c.slug}`} className="font-semibold text-sm text-ink hover:underline">
                                {c.name}
                              </Link>

                              {(c.children?.length ?? 0) > 0 ? (
                                <ul className="mt-2 space-y-1">
                                  {c.children.slice(0, 6).map((g) => (
                                    <li key={g.id}>
                                      <Link
                                        href={`/${g.slug}`}
                                        className="text-sm text-slate-600 hover:text-ink hover:underline"
                                      >
                                        {g.name}
                                      </Link>
                                    </li>
                                  ))}
                                  {c.children.length > 6 ? (
                                    <li className="text-xs text-slate-500">+ {c.children.length - 6} autres…</li>
                                  ) : null}
                                </ul>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </nav>

          <div className="lg:hidden text-xs text-slate-500">Menu : utilisez le bouton ☰</div>
        </div>
      </div>

      {mobileOpen ? (
        <div className="lg:hidden">
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-[86%] max-w-sm bg-white z-50 border-l border-ring shadow-card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ring">
              <span className="text-sm font-semibold text-slate-800">Menu</span>
              <button
                type="button"
                className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-ring bg-white hover:bg-muted"
                aria-label="Fermer le menu"
                onClick={() => setMobileOpen(false)}
              >
                <IconClose className="h-5 w-5 text-slate-800" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="rounded-2xl border border-ring bg-muted p-3">
                {status === "loading" ? (
                  <div className="h-9 w-24 rounded-lg bg-white animate-pulse" />
                ) : session ? (
                  <Link href={profileHref} className="inline-flex items-center gap-2 text-sm text-ink">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt={user?.name ?? "Avatar"}
                        className="h-7 w-7 rounded-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-semibold">
                        {initials || "ME"}
                      </span>
                    )}
                    <span className="font-medium">{profileLabel}</span>
                  </Link>
                ) : (
                  <button onClick={() => signIn(undefined, { callbackUrl: "/admin" })} className="btn w-full">
                    Se connecter
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <Link href="/pages" className={`block ${navLinkClass(Boolean(pathname?.startsWith("/pages")))}`}>
                  Guides
                </Link>

                {topLevel.map((n) => {
                  const hasChildren = (n.children?.length ?? 0) > 0;
                  const active = isActivePath(n.slug);

                  if (!hasChildren) {
                    return (
                      <Link key={n.id} href={`/${n.slug}`} className={`block ${navLinkClass(active)}`}>
                        {n.name}
                      </Link>
                    );
                  }

                  const opened = Boolean(openIds[n.id]);
                  return (
                    <div key={n.id} className="rounded-xl border border-ring/70 overflow-hidden">
                      <div className="flex items-center">
                        <Link
                          href={`/${n.slug}`}
                          className={`flex-1 px-3 py-2 text-sm font-medium ${active ? "bg-brand-500/15" : "bg-white"}`}
                        >
                          {n.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleOpen(n.id)}
                          className="px-3 py-2 text-sm text-slate-600 hover:bg-muted"
                          aria-expanded={opened}
                          aria-label={opened ? `Fermer ${n.name}` : `Ouvrir ${n.name}`}
                        >
                          {opened ? "–" : "+"}
                        </button>
                      </div>

                      {opened ? (
                        <div className="px-3 pb-2 pt-1 bg-muted/30">
                          <ul className="space-y-1">
                            {n.children.map((c) => (
                              <li key={c.id}>
                                <Link href={`/${c.slug}`} className="block py-1 text-sm text-ink hover:underline">
                                  {c.name}
                                </Link>

                                {(c.children?.length ?? 0) > 0 ? (
                                  <ul className="mt-1 ml-3 border-l border-ring/60 pl-3 space-y-1">
                                    {c.children.map((g) => (
                                      <li key={g.id}>
                                        <Link
                                          href={`/${g.slug}`}
                                          className="block py-0.5 text-sm text-slate-600 hover:text-ink hover:underline"
                                        >
                                          {g.name}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
