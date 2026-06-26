// src/components/Footer.tsx
import Link from "next/link";
import type { PageKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentSiteId } from "@/lib/currentSite";
import { getSiteConfig } from "@/config/site";

const year = new Date().getFullYear();

type FooterLink = {
  href: string;
  label: string;
};

function asTrustItems(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function pageHref(slug: string) {
  return `/pages/${slug}`;
}

function categoryHref(slug: string) {
  return `/${slug}`;
}

function brandHref(slug: string) {
  return `/marques/${slug}`;
}

function toPageLinks(pages: Array<{ slug: string; title: string }>): FooterLink[] {
  return pages.map((page) => ({
    href: pageHref(page.slug),
    label: page.title,
  }));
}

function toCategoryLinks(categories: Array<{ slug: string; name: string }>): FooterLink[] {
  return categories.map((category) => ({
    href: categoryHref(category.slug),
    label: category.name,
  }));
}

function toBrandLinks(brands: Array<{ slug: string; name: string }>): FooterLink[] {
  return brands.map((brand) => ({
    href: brandHref(brand.slug),
    label: brand.name,
  }));
}

function FooterColumn({
  title,
  links,
  fallbackLink,
}: {
  title: string;
  links: FooterLink[];
  fallbackLink?: FooterLink;
}) {
  const finalLinks = fallbackLink ? [...links, fallbackLink] : links;
  if (finalLinks.length === 0) return null;

  return (
    <div>
      <h3 className="text-base font-black tracking-tight text-slate-950">
        {title}
      </h3>

      <ul className="mt-4 space-y-2.5 text-sm">
        {finalLinks.slice(0, 8).map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link
              className="text-slate-600 transition hover:text-brand-700"
              href={link.href}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExplorerColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  if (links.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-950">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {links.slice(0, 5).map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link
              href={link.href}
              className="text-slate-600 transition hover:text-brand-700"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function Footer() {
  const siteId = await getCurrentSiteId();
  const siteConfig = getSiteConfig(siteId);

  const [
    settings,
    footerCategories,
    footerBrands,
    footerGuides,
    footerComparatifs,
    latestGuides,
    latestBrands,
    latestCategories,
    latestComparatifs,
  ] = await Promise.all([
    prisma.siteSettings.findUnique({
      where: { siteId },
      select: {
        name: true,
        tagline: true,
        logoSrc: true,
        logoAlt: true,
        footerTrustTitle: true,
        footerTrustItems: true,
        footerCopyright: true,
      },
    }),

    prisma.category.findMany({
      where: { published: true, showInFooter: true },
      orderBy: [{ footerOrder: "asc" }, { name: "asc" }],
      take: 8,
      select: { name: true, slug: true },
    }),

    prisma.brand.findMany({
      where: { active: true, showInFooter: true },
      orderBy: [{ footerOrder: "asc" }, { name: "asc" }],
      take: 8,
      select: { name: true, slug: true },
    }),

    prisma.page.findMany({
      where: {
        published: true,
        showInFooter: true,
        kind: "GUIDE" as PageKind,
      },
      orderBy: [{ footerOrder: "asc" }, { title: "asc" }],
      take: 8,
      select: { title: true, slug: true },
    }),

    prisma.page.findMany({
      where: {
        published: true,
        showInFooter: true,
        kind: "COMPARATIF" as PageKind,
      },
      orderBy: [{ footerOrder: "asc" }, { title: "asc" }],
      take: 8,
      select: { title: true, slug: true },
    }),

    prisma.page.findMany({
      where: { published: true, kind: "GUIDE" as PageKind },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { title: true, slug: true },
    }),

    prisma.brand.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { name: true, slug: true },
    }),

    prisma.category.findMany({
      where: { published: true },
      orderBy: [{ showInFooter: "desc" }, { footerOrder: "asc" }, { updatedAt: "desc" }],
      take: 5,
      select: { name: true, slug: true },
    }),

    prisma.page.findMany({
      where: { published: true, kind: "COMPARATIF" as PageKind },
      orderBy: [{ showInFooter: "desc" }, { footerOrder: "asc" }, { createdAt: "desc" }],
      take: 5,
      select: { title: true, slug: true },
    }),
  ]);

  const siteName = settings?.name || siteConfig.name;
  const tagline = settings?.tagline || siteConfig.tagline;
  const logoSrc = settings?.logoSrc || siteConfig.brand.logoSrc;
  const logoAlt = settings?.logoAlt || siteName;

  const trustItems = asTrustItems(settings?.footerTrustItems);
  const trustTitle =
    settings?.footerTrustTitle ||
    (trustItems.length > 0 ? `Pourquoi utiliser ${siteName} ?` : "");

  const copyright =
    settings?.footerCopyright ||
    `${siteName} — Certains liens peuvent être affiliés. Prix susceptibles d’évolution.`;

  const categoryLinks = toCategoryLinks(footerCategories);
  const guideLinks = toPageLinks(footerGuides);
  const brandLinks = toBrandLinks(footerBrands);
  const comparatifLinks = toPageLinks(footerComparatifs);

  const latestGuideLinks = toPageLinks(latestGuides);
  const latestBrandLinks = toBrandLinks(latestBrands);
  const latestCategoryLinks = toCategoryLinks(latestCategories);
  const latestComparatifLinks = toPageLinks(latestComparatifs);

  return (
    <footer className="mt-16 clean-links">
      <div className="brand-gradient h-1 w-full" />

      {trustItems.length > 0 ? (
        <section className="bg-slate-950 text-white">
          <div className="container-page py-8 md:py-10">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_2fr] lg:items-center">
              <div>
                <h2 className="text-xl font-black tracking-tight md:text-2xl">
                  {trustTitle}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
                  Des repères simples pour comparer, choisir et acheter plus intelligemment.
                </p>
              </div>

              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {trustItems.slice(0, 4).map((item) => (
                  <li
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/90"
                  >
                    <span className="mr-2 text-brand-300">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-slate-50">
        <div className="container-page py-10 md:py-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
            <div>
              <Link href="/" className="inline-flex items-center">
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoSrc}
                    alt={logoAlt}
                    className="h-11 w-auto max-w-[190px] object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="text-xl font-black text-slate-950">
                    {siteName}
                  </span>
                )}
              </Link>

              {tagline ? (
                <p className="mt-5 max-w-sm text-sm leading-7 text-slate-600">
                  {tagline}
                </p>
              ) : null}

              <form action="/search" method="GET" className="mt-6 max-w-md">
                <label htmlFor="footer-search" className="text-sm font-bold text-slate-950">
                  Vous cherchez autre chose ?
                </label>
                <div className="mt-3 flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <input
                    id="footer-search"
                    name="q"
                    type="search"
                    placeholder="Rechercher un produit, une marque..."
                    className="min-w-0 flex-1 px-4 py-3 text-sm outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-brand-700"
                  >
                    OK
                  </button>
                </div>
              </form>
            </div>

            <FooterColumn title="Catégories" links={categoryLinks} />
            <FooterColumn title="Guides" links={guideLinks} fallbackLink={{ href: "/pages", label: "Tous les guides" }} />
            <FooterColumn title="Marques" links={brandLinks} fallbackLink={{ href: "/marques", label: "Toutes les marques" }} />
            <FooterColumn title="Comparatifs" links={comparatifLinks} />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="container-page py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="lg:max-w-xs">
              <h2 className="text-lg font-black text-slate-950">
                Explorer {siteName}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Retrouvez les derniers contenus et les principales pages utiles du site.
              </p>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <ExplorerColumn title="Derniers guides" links={latestGuideLinks} />
              <ExplorerColumn title="Dernières marques" links={latestBrandLinks} />
              <ExplorerColumn title="Catégories à explorer" links={latestCategoryLinks} />
              <ExplorerColumn title="Comparatifs" links={latestComparatifLinks} />
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-slate-200 bg-white">
        <div className="container-page flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            © {year} {copyright}
          </p>

          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <li><Link className="text-slate-500 hover:text-brand-700" href="/mentions-legales">Mentions légales</Link></li>
            <li><Link className="text-slate-500 hover:text-brand-700" href="/confidentialite">Confidentialité</Link></li>
            <li><Link className="text-slate-500 hover:text-brand-700" href="/cookies">Cookies</Link></li>
            <li><Link className="text-slate-500 hover:text-brand-700" href="/cgu">CGU</Link></li>
            <li><Link className="text-slate-500 hover:text-brand-700" href="/contact">Contact</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}