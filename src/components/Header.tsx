// src/components/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useEffect, useMemo, useState } from "react";

type FeaturedGuide = { id: number; title: string; slug: string };
type FeaturedBrand = { id: number; name: string; slug: string };

type NavItem = {
  id: number;
  name: string;
  slug: string;
  children: NavItem[];
  featuredGuides?: FeaturedGuide[];
  featuredBrands?: FeaturedBrand[];
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

type AsideLink = {
  label: string;
  href: string;
};

type MegaAsideConfig = {
  brands?: AsideLink[];
  guides?: AsideLink[];
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
  if (siteId === "meilleur-running") return "Rechercher une chaussure, modèle ou marque…";
  if (siteId === "meilleur-trail") return "Rechercher une chaussure, équipement ou marque…";
  return "Rechercher un ski, modèle ou marque…";
}

function getMegaIntro(item: NavItem) {
  const count = item.children?.length ?? 0;

  if (item.slug === "ski") {
    return "Tout le matériel de ski alpin au même endroit : skis, packs, chaussures, fixations et bâtons.";
  }

  if (item.slug === "ski-randonnee") {
    return "L'équipement essentiel pour la montée, la descente et la sécurité : skis, packs, fixations, chaussures, peaux et avalanche.";
  }

  if (item.slug === "snowboard") {
    return "Planches, splitboards, packs, fixations, boots et accessoires pour toutes les pratiques snowboard.";
  }

  if (item.slug === "ski-nordique") {
    return "Skating, classique et entretien : accédez rapidement au bon matériel de ski nordique.";
  }

  if (item.slug === "vetements-ski") {
    return "Vestes, pantalons et couches techniques pour composer une tenue de ski efficace et confortable.";
  }

  if (item.slug === "protections-ski") {
    return "Casques, masques, dorsales, sacs et housses pour compléter votre équipement avec les bons accessoires.";
  }

  return count > 0
    ? `Découvrez les principales familles de la catégorie ${item.name}.`
    : `Accédez directement à la catégorie ${item.name}.`;
}

function getAsideConfig(item: NavItem, guideItems: GuideNavItem[]): MegaAsideConfig {
  const brands = item.featuredBrands?.map((brand) => ({
    label: brand.name,
    href: `/marques/${brand.slug}`,
  })) ?? [];

  const guides = item.featuredGuides?.map((guide) => ({
    label: guide.title,
    href: `/pages/${guide.slug}`,
  })) ?? [];

  if (brands.length > 0 || guides.length > 0) return { brands, guides };

  return {
    guides: guideItems.slice(0, 4).map((g) => ({
      label: g.name,
      href: `/pages#${g.slug}`,
    })),
  };
}

function AsideContent({
  config,
  compact = false,
}: {
  config: MegaAsideConfig;
  compact?: boolean;
}) {
  const hasBrands = (config.brands?.length ?? 0) > 0;
  const hasGuides = (config.guides?.length ?? 0) > 0;

  if (!hasBrands && !hasGuides) return null;

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {hasBrands ? (
        <div className={compact ? "rounded-2xl bg-brand-700 p-4 text-white" : "rounded-2xl bg-white/10 p-4 ring-1 ring-white/15"}>
          <p className={compact ? "text-sm font-bold text-white" : "text-sm font-bold text-white"}>Marques populaires</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {config.brands?.map((brand) => (
              <Link
                key={`${brand.href}-${brand.label}`}
                href={brand.href}
                className={
                  compact
                    ? "rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/15"
                    : "rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white hover:bg-white/15"
                }
              >
                {brand.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {hasGuides ? (
        <div className={compact ? "rounded-2xl border border-ring bg-white p-4" : "rounded-2xl bg-white/10 p-4 ring-1 ring-white/15"}>
          <p className={compact ? "text-sm font-bold text-ink" : "text-sm font-bold text-white"}>Guides utiles</p>
          <div className="mt-3 space-y-2">
            {config.guides?.map((guide) => (
              <Link
                key={`${guide.href}-${guide.label}`}
                href={guide.href}
                className={
                  compact
                    ? "flex items-center justify-between gap-3 text-sm font-medium text-slate-700 hover:text-brand-700"
                    : "flex items-center justify-between gap-3 text-sm font-semibold text-white hover:text-white/85"
                }
              >
                <span>{guide.label}</span>
                <span className={compact ? "text-slate-400" : "text-white/50"}>→</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MegaMenu({
  item,
  guideItems,
}: {
  item: NavItem;
  guideItems: GuideNavItem[];
}) {
  const asideConfig = getAsideConfig(item, guideItems);
  const hasAside = (asideConfig.brands?.length ?? 0) > 0 || (asideConfig.guides?.length ?? 0) > 0;

  return (
    <div
      className="fixed left-1/2 top-[118px] z-50 w-[1040px] max-w-[calc(100vw-2rem)] -translate-x-1/2 pt-3 opacity-0 pointer-events-none translate-y-2 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-200"
    >
      <div className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
        <div className={hasAside ? "grid grid-cols-[minmax(0,1fr)_280px]" : "grid grid-cols-1"}>
          <div className="p-6">
            <div className="mb-5 border-b border-slate-200 pb-4">
              <Link href={`/${item.slug}`} className="block text-xl font-extrabold tracking-[-0.02em] text-ink hover:text-brand-700">
                {item.name}
              </Link>
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">{getMegaIntro(item)}</p>
            </div>

            <div className="grid grid-cols-3 gap-x-8 gap-y-7">
              {item.children.map((child) => (
                <div key={child.id} className="min-w-0">
                  <Link
                    href={`/${child.slug}`}
                    className="flex items-center gap-2 text-sm font-extrabold text-slate-950 hover:text-brand-700"
                  >
                    <span className="h-2 w-2 rounded-full bg-sec-500" />
                    <span>{child.name}</span>
                  </Link>

                  {(child.children?.length ?? 0) > 0 ? (
                    <ul className="mt-3 space-y-1.5">
                      {child.children.map((sub) => (
                        <li key={sub.id}>
                          <Link
                            href={`/${sub.slug}`}
                            className="inline-flex items-center gap-2 text-sm leading-5 text-slate-600 hover:text-brand-700"
                          >
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span>{sub.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {hasAside ? (
            <aside className="bg-gradient-to-b from-brand-900 to-brand-700 p-5 text-white">
              <AsideContent config={asideConfig} />
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MobileCategoryPanel({
  item,
  guideItems,
}: {
  item: NavItem;
  guideItems: GuideNavItem[];
}) {
  const asideConfig = getAsideConfig(item, guideItems);

  return (
    <div className="bg-muted/30 px-3 pb-3 pt-1">
      <div className="space-y-3">
        {item.children.map((child) => (
          <div key={child.id} className="border-t border-ring/60 pt-3 first:border-t-0 first:pt-2">
            <Link href={`/${child.slug}`} className="flex items-center gap-2 text-sm font-bold text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-sec-500" />
              {child.name}
            </Link>

            {(child.children?.length ?? 0) > 0 ? (
              <ul className="ml-3 mt-2 space-y-1 border-l border-ring/60 pl-3">
                {child.children.map((g) => (
                  <li key={g.id}>
                    <Link href={`/${g.slug}`} className="block py-0.5 text-sm text-slate-600">
                      {g.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}

        <div className="pt-2">
          <AsideContent config={asideConfig} compact />
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();

  const [siteId, setSiteId] = useState<string | undefined>();
  const [searchPlaceholder, setSearchPlaceholder] = useState("Rechercher…");
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [guideItems, setGuideItems] = useState<GuideNavItem[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const currentSiteId = document.documentElement.dataset.siteId;
    setSiteId(currentSiteId);
    setSearchPlaceholder(getSearchPlaceholder(currentSiteId));
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
      active ? "bg-brand-500/15 text-ink" : "text-slate-700 hover:bg-slate-100 hover:text-ink"
    }`;

  const isActivePath = (slug: string) => Boolean(pathname?.startsWith(`/${slug}`));

  const orderedNavItems = useMemo(() => navItems, [navItems]);

  return (
    <header className="sticky top-0 z-50 border-b border-ring clean-links">
      <div className="h-1 w-full brand-gradient" />

      <div className="bg-bg/80 supports-[backdrop-filter]:backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <Logo />
            </div>

            <div className="hidden lg:flex flex-1 justify-center">
              <form action="/search" className="w-full max-w-[640px]">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    name="q"
                    placeholder={searchPlaceholder}
                    className="w-full rounded-xl border border-ring bg-white/95 py-2 pl-10 pr-28 text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button aria-label="Rechercher" className="absolute right-1 top-1 rounded-lg bg-sec-500 px-3 py-1.5 text-sm text-white hover:bg-sec-600">
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
                <button aria-label="Rechercher" className="absolute right-1 top-1 rounded-lg bg-sec-500 px-3 py-1.5 text-sm text-white hover:bg-sec-600">
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
              {orderedNavItems.map((n, index) => {
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
                      guideItems={guideItems}
                    />
                  </div>
                );
              })}

              <div className="group relative">
                <Link href="/pages" className={navLinkClass(Boolean(pathname?.startsWith("/pages")))} aria-haspopup="menu">
                  Guides
                </Link>

                <div className="absolute right-0 top-full z-50 w-[420px] max-w-[calc(100vw-2rem)] pt-3 opacity-0 pointer-events-none translate-y-2 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-200">
                  <div className="rounded-[1.35rem] border border-slate-200/80 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Guides</p>

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

              <Link href="/marques" className={navLinkClass(Boolean(pathname?.startsWith("/marques")))}>
                Marques
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {mobileOpen ? (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)} />

          <div className="fixed right-0 top-0 z-50 h-full w-[88%] max-w-sm border-l border-ring bg-white shadow-card">
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

            <div className="h-[calc(100vh-65px)] overflow-y-auto bg-slate-50 p-4">
              <div className="space-y-2">
                {orderedNavItems.map((n) => {
                  const hasChildren = (n.children?.length ?? 0) > 0;
                  const active = isActivePath(n.slug);

                  if (!hasChildren) {
                    return (
                      <Link key={n.id} href={`/${n.slug}`} className={`block rounded-xl px-3 py-2 text-sm font-medium ${active ? "bg-brand-500/15 text-ink" : "bg-white text-slate-700 hover:bg-muted"}`}>
                        {n.name}
                      </Link>
                    );
                  }

                  const key = `cat-${n.id}`;
                  const opened = Boolean(openIds[key]);

                  return (
                    <div key={n.id} className="overflow-hidden rounded-2xl border border-ring bg-white">
                      <div className="flex items-center">
                        <Link href={`/${n.slug}`} className={`flex-1 px-3 py-3 text-sm font-bold ${active ? "bg-brand-500/15 text-ink" : "bg-white text-ink"}`}>
                          {n.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleOpen(key)}
                          className="px-4 py-3 text-lg font-semibold text-slate-600 hover:bg-muted"
                          aria-expanded={opened}
                        >
                          {opened ? "–" : "+"}
                        </button>
                      </div>

                      {opened ? <MobileCategoryPanel item={n} guideItems={guideItems} /> : null}
                    </div>
                  );
                })}

                <div className="overflow-hidden rounded-2xl border border-ring bg-white">
                  <div className="flex items-center">
                    <Link href="/pages" className={`flex-1 px-3 py-3 text-sm font-bold ${pathname?.startsWith("/pages") ? "bg-brand-500/15 text-ink" : "bg-white text-ink"}`}>
                      Guides
                    </Link>
                    <button type="button" onClick={() => toggleOpen("guides")} className="px-4 py-3 text-lg font-semibold text-slate-600 hover:bg-muted" aria-expanded={Boolean(openIds.guides)}>
                      {openIds.guides ? "–" : "+"}
                    </button>
                  </div>

                  {openIds.guides ? (
                    <div className="bg-muted/30 px-3 pb-3 pt-1">
                      <ul className="space-y-1">
                        <li>
                          <Link href="/pages" className="block py-1 text-sm font-medium text-ink">
                            Tous les guides
                          </Link>
                        </li>
                        {guideItems.map((g) => (
                          <li key={g.id}>
                            <Link href={`/pages#${g.slug}`} className="block py-1 text-sm text-slate-600">
                              {g.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <Link href="/marques" className={`block rounded-2xl border border-ring bg-white px-3 py-3 text-sm font-bold ${pathname?.startsWith("/marques") ? "bg-brand-500/15 text-ink" : "text-ink"}`}>
                  Marques
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
