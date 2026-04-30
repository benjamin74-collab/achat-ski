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

function MegaMenu({ item, align = "center" }: { item: NavItem; align?: "left" | "center" | "right" }) {
  const positionClass =
    align === "left"
      ? "left-0"
      : align === "right"
        ? "right-0"
        : "left-1/2 -translate-x-1/2";

  return (
    <div
      className={`absolute top-full z-50 w-[720px] max-w-[calc(100vw-2rem)] pt-3 opacity-0 pointer-events-none translate-y-2 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-200 ${positionClass}`}
    >
      <div className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
        <div className="grid grid-cols-[1fr_220px]">
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                  Catégorie
                </p>
                <Link href={`/${item.slug}`} className="mt-1 block text-lg font-bold text-ink hover:text-brand-600">
                  {item.name}
                </Link>
              </div>

              <Link
                href={`/${item.slug}`}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                Tout voir
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {item.children.map((child) => (
                <div
                  key={child.id}
                  className="group/card rounded-2xl border border-slate-200 bg-white p-3.5 transition hover:border-brand-200 hover:bg-slate-50/80"
                >
                  <Link href={`/${child.slug}`} className="block text-sm font-bold text-slate-900 group-hover/card:text-brand-700">
                    {child.name}
                  </Link>

                  {(child.children?.length ?? 0) > 0 ? (
                    <ul className="mt-2.5 space-y-1.5">
                      {child.children.slice(0, 5).map((sub) => (
                        <li key={sub.id}>
                          <Link href={`/${sub.slug}`} className="block text-sm leading-5 text-slate-600 hover:text-brand-700">
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                      {child.children.length > 5 ? (
                        <li className="pt-1 text-xs font-medium text-slate-400">
                          + {child.children.length - 5} autres catégories
                        </li>
                      ) : null}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Comparatifs, prix et meilleurs choix.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <aside className="border-l border-slate-200 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Accès rapide
            </p>

            <div className="mt-4 space-y-2">
              <Link
                href={`/${item.slug}`}
                className="block rounded-2xl bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200"
              >
                Voir toute la catégorie
              </Link>

              <Link
                href="/pages"
                className="block rounded-2xl bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200"
              >
                Guides d’achat
              </Link>

              <Link
                href="/search"
                className="block rounded-2xl bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200"
              >
                Comparer les prix
              </Link>
            </div>

            <div className="mt-5 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
              <p className="text-sm font-bold text-slate-900">Conseil expert</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Comparez les modèles, les marques et les prix avant d’acheter votre matériel.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();

  const [searchPlaceholder, setSearchPlaceholder] = useState("Rechercher…");
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [guideItems, setGuideItems] = useState<GuideNavItem[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const siteId = document.documentElement.dataset.siteId;
    setSearchPlaceholder(getSearchPlaceholder(siteId));
  }, []);

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

  useEffect(() => {
    if (!mobileOpen) setOpenIds({});
  }, [mobileOpen]);

  const toggleOpen = (id: string) => setOpenIds((s) => ({ ...s, [id]: !s[id] }));

  const navLinkClass = (active: boolean) =>
    `relative inline-flex min-h-[44px] max-w-[132px] items-center justify-center rounded-full px-3 py-1.5 text-center text-[13px] font-medium leading-tight transition no-underline hover:no-underline xl:max-w-none xl:px-3.5 xl:text-sm ${
      active
        ? "bg-brand-500/15 text-ink"
        : "text-slate-700 hover:bg-slate-100 hover:text-ink"
    }`;

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
                  <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    name="q"
                    placeholder={searchPlaceholder}
                    className="w-full rounded-xl border border-ring bg-white/95 py-2 pl-10 pr-28 text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    aria-label="Rechercher"
                    className="absolute right-1 top-1 rounded-lg bg-sec-500 px-3 py-1.5 text-sm text-white hover:bg-sec-600"
                  >
                    Rechercher
                  </button>
                </div>
              </form>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ring bg-white hover:bg-muted lg:hidden"
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
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="q"
                  placeholder={searchPlaceholder}
                  className="w-full rounded-xl border border-ring bg-white/95 py-2 pl-10 pr-20 text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  aria-label="Rechercher"
                  className="absolute right-1 top-1 rounded-lg bg-sec-500 px-3 py-1.5 text-sm text-white hover:bg-sec-600"
                >
                  Go
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-ring bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <nav className="hidden lg:block">
            <div className="flex min-h-13 items-center justify-center gap-1">
              <div className="group relative">
                <Link href="/pages" className={navLinkClass(Boolean(pathname?.startsWith("/pages")))} aria-haspopup="menu">
                  Guides
                </Link>

                <div className="absolute left-0 top-full z-50 w-[420px] max-w-[calc(100vw-2rem)] pt-3 opacity-0 pointer-events-none translate-y-2 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-200">
                  <div className="rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                      Guides
                    </p>

                    <Link href="/pages" className="mt-1 block text-lg font-bold text-ink hover:text-brand-600">
                      Tous les guides
                    </Link>

                    <div className="mt-4 grid gap-2">
                      {guideItems.map((g) => (
                        <Link
                          key={g.id}
                          href={`/pages#${g.slug}`}
                          className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                        >
                          {g.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {navItems.map((n, index) => {
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
                  <div key={n.id} className="group relative">
                    <Link href={href} className={navLinkClass(active)} aria-haspopup="menu">
                      {n.name}
                    </Link>

                    <MegaMenu
                      item={n}
                      align={index <= 1 ? "left" : index >= navItems.length - 2 ? "right" : "center"}
                    />
                  </div>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      {mobileOpen ? (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)} />

          <div className="fixed right-0 top-0 z-50 h-full w-[86%] max-w-sm border-l border-ring bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-ring px-4 py-3">
              <span className="text-sm font-semibold text-slate-800">Menu</span>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ring bg-white hover:bg-muted"
                aria-label="Fermer le menu"
                onClick={() => setMobileOpen(false)}
              >
                <IconClose className="h-5 w-5 text-slate-800" />
              </button>
            </div>

            <div className="h-[calc(100vh-65px)] overflow-y-auto p-4">
              <div className="space-y-2">
                <div className="overflow-hidden rounded-xl border border-ring/70">
                  <div className="flex items-center">
                    <Link
                      href="/pages"
                      className={`flex-1 px-3 py-2 text-sm font-medium ${
                        pathname?.startsWith("/pages") ? "bg-brand-500/15" : "bg-white"
                      }`}
                    >
                      Guides
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleOpen("guides")}
                      className="px-3 py-2 text-sm text-slate-600 hover:bg-muted"
                      aria-expanded={Boolean(openIds.guides)}
                    >
                      {openIds.guides ? "–" : "+"}
                    </button>
                  </div>

                  {openIds.guides ? (
                    <div className="bg-muted/30 px-3 pb-2 pt-1">
                      <ul className="space-y-1">
                        <li>
                          <Link href="/pages" className="block py-1 text-sm text-ink">
                            Tous les guides
                          </Link>
                        </li>
                        {guideItems.map((g) => (
                          <li key={g.id}>
                            <Link href={`/pages#${g.slug}`} className="block py-1 text-sm text-ink">
                              {g.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                {navItems.map((n) => {
                  const hasChildren = (n.children?.length ?? 0) > 0;
                  const active = isActivePath(n.slug);

                  if (!hasChildren) {
                    return (
                      <Link
                        key={n.id}
                        href={`/${n.slug}`}
                        className={`block rounded-xl px-3 py-2 text-sm font-medium ${
                          active ? "bg-brand-500/15 text-ink" : "text-slate-700 hover:bg-muted"
                        }`}
                      >
                        {n.name}
                      </Link>
                    );
                  }

                  const key = `cat-${n.id}`;
                  const opened = Boolean(openIds[key]);

                  return (
                    <div key={n.id} className="overflow-hidden rounded-xl border border-ring/70">
                      <div className="flex items-center">
                        <Link
                          href={`/${n.slug}`}
                          className={`flex-1 px-3 py-2 text-sm font-medium ${
                            active ? "bg-brand-500/15" : "bg-white"
                          }`}
                        >
                          {n.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleOpen(key)}
                          className="px-3 py-2 text-sm text-slate-600 hover:bg-muted"
                          aria-expanded={opened}
                        >
                          {opened ? "–" : "+"}
                        </button>
                      </div>

                      {opened ? (
                        <div className="bg-muted/30 px-3 pb-2 pt-1">
                          <ul className="space-y-1">
                            {n.children.map((c) => (
                              <li key={c.id}>
                                <Link href={`/${c.slug}`} className="block py-1 text-sm font-medium text-ink">
                                  {c.name}
                                </Link>

                                {(c.children?.length ?? 0) > 0 ? (
                                  <ul className="ml-3 mt-1 space-y-1 border-l border-ring/60 pl-3">
                                    {c.children.map((g) => (
                                      <li key={g.id}>
                                        <Link href={`/${g.slug}`} className="block py-0.5 text-sm text-slate-600">
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