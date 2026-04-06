// src/components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useEffect, useState } from "react";

type NavItem = {
  id: number;
  name: string;
  slug: string;
  children: NavItem[];
};

type GuideNavItem = {
  id: number;
  name: string;
  slug: string;
};

type NavResponse = {
  categories: NavItem[];
  guideCategories: GuideNavItem[];
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

  const [searchPlaceholder, setSearchPlaceholder] = useState("Rechercher…");
  useEffect(() => {
    const siteId = document.documentElement.dataset.siteId;
    setSearchPlaceholder(getSearchPlaceholder(siteId));
  }, []);

  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [guideItems, setGuideItems] = useState<GuideNavItem[]>([]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/nav", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as NavResponse;
        if (!aborted) {
          setNavItems(data.categories ?? []);
          setGuideItems(data.guideCategories ?? []);
        }
      } catch {
        // silencieux
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  const topLevel = navItems;

  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!mobileOpen) setOpenIds({});
  }, [mobileOpen]);

  const toggleOpen = (id: string) => setOpenIds((s) => ({ ...s, [id]: !s[id] }));

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
              <div className="relative group">
                <Link href="/pages" className={navLinkClass(Boolean(pathname?.startsWith("/pages")))} aria-haspopup="menu">
                  Guides
                </Link>

                <div className="absolute left-0 top-full pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition">
                  <div className="w-[360px] rounded-2xl border border-ring bg-white shadow-card p-3">
                    <div className="space-y-2">
                      <div className="rounded-xl border border-ring/60 p-3 hover:bg-muted/40">
                        <Link href="/pages" className="font-semibold text-sm text-ink hover:underline">
                          Tous les guides
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">
                          Voir l’ensemble des guides, conseils et comparatifs.
                        </p>
                      </div>

                      {guideItems.map((g) => (
                        <div key={g.id} className="rounded-xl border border-ring/60 p-3 hover:bg-muted/40">
                          <Link href={`/pages#${g.slug}`} className="font-semibold text-sm text-ink hover:underline">
                            {g.name}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

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
              <div className="space-y-1">
                <div className="rounded-xl border border-ring/70 overflow-hidden">
                  <div className="flex items-center">
                    <Link
                      href="/pages"
                      className={`flex-1 px-3 py-2 text-sm font-medium ${pathname?.startsWith("/pages") ? "bg-brand-500/15" : "bg-white"}`}
                    >
                      Guides
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleOpen("guides")}
                      className="px-3 py-2 text-sm text-slate-600 hover:bg-muted"
                      aria-expanded={Boolean(openIds.guides)}
                      aria-label={openIds.guides ? "Fermer Guides" : "Ouvrir Guides"}
                    >
                      {openIds.guides ? "–" : "+"}
                    </button>
                  </div>

                  {openIds.guides ? (
                    <div className="px-3 pb-2 pt-1 bg-muted/30">
                      <ul className="space-y-1">
                        <li>
                          <Link href="/pages" className="block py-1 text-sm text-ink hover:underline">
                            Tous les guides
                          </Link>
                        </li>
                        {guideItems.map((g) => (
                          <li key={g.id}>
                            <Link href={`/pages#${g.slug}`} className="block py-1 text-sm text-ink hover:underline">
                              {g.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

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

                  const key = `cat-${n.id}`;
                  const opened = Boolean(openIds[key]);

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
                          onClick={() => toggleOpen(key)}
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