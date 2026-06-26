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

function toPageLinks(
  pages: Array<{ slug: string; title: string }>,
): FooterLink[] {
  return pages.map((page) => ({
    href: pageHref(page.slug),
    label: page.title,
  }));
}

function toCategoryLinks(
  categories: Array<{ slug: string; name: string }>,
): FooterLink[] {
  return categories.map((category) => ({
    href: categoryHref(category.slug),
    label: category.name,
  }));
}

function toBrandLinks(
  brands: Array<{ slug: string; name: string }>,
): FooterLink[] {
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
      <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-950">
        {title}
      </h3>

      <ul className="mt-4 space-y-2 text-sm">
        {finalLinks.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link className="text-slate-600 hover:text-brand-700" href={link.href}>
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
      where: {
        published: true,
        showInFooter: true,
      },
      orderBy: [{ footerOrder: "asc" }, { name: "asc" }],
      take: 8,
      select: {
        name: true,
        slug: true,
      },
    }),

    prisma.brand.findMany({
      where: {
        active: true,
        showInFooter: true,
      },
      orderBy: [{ footerOrder: "asc" }, { name: "asc" }],
      take: 8,
      select: {
        name: true,
        slug: true,
      },
    }),

    prisma.page.findMany({
      where: {
        published: true,
        showInFooter: true,
        kind: "GUIDE" as PageKind,
      },
      orderBy: [{ footerOrder: "asc" }, { title: "asc" }],
      take: 8,
      select: {
        title: true,
        slug: true,
      },
    }),

    prisma.page.findMany({
      where: {
        published: true,
        showInFooter: true,
        kind: "COMPARATIF" as PageKind,
      },
      orderBy: [{ footerOrder: "asc" }, { title: "asc" }],
      take: 8,
      select: {
        title: true,
        slug: true,
      },
    }),

    prisma.page.findMany({
      where: {
        published: true,
        kind: "GUIDE" as PageKind,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        title: true,
        slug: true,
      },
    }),

    prisma.brand.findMany({
      where: {
        active: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        name: true,
        slug: true,
      },
    }),

    prisma.category.findMany({
      where: {
        published: true,
      },
      orderBy: [{ showInFooter: "desc" }, { footerOrder: "asc" }, { updatedAt: "desc" }],
      take: 5,
      select: {
        name: true,
        slug: true,
      },
    }),

    prisma.page.findMany({
      where: {
        published: true,
        kind: "COMPARATIF" as PageKind,
      },
      orderBy: [{ showInFooter: "desc" }, { footerOrder: "asc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        title: true,
        slug: true,
      },
    }),
  ]);

  const siteName = settings?.name || siteConfig.name;
  const tagline = settings?.tagline || siteConfig.tagline;
  const logoSrc = settings?.logoSrc || siteConfig.brand.logoSrc;
  const logoAlt = settings?.logoAlt || siteName;

  const trustItems = asTrustItems(settings?.footerTrustItems);
  const trustTitle =
    settings?.footerTrustTitle || (trustItems.length > 0 ? `Pourquoi utiliser ${siteName} ?` : "");

  const copyright =
    settings?.footerCopyright ||
    `${siteName} — Certains liens peuvent être affiliés. Prix susceptibles d’évolution.`;

  const categoryLinks = toCategoryLinks(footerCategories);
  const guideLinks = toPageLinks(footerGuides);
  const brandLinks = toBrandLinks(footerBrands);
  const comparatifLinks = toPageLinks(footerComparatifs);

  const explorerBlocks = [
    {
      title: "Derniers guides",
      links: toPageLinks(latestGuides),
    },
    {
      title: "Dernières marques",
      links: toBrandLinks(latestBrands),
    },
    {
      title: "Catégories à explorer",
      links: toCategoryLinks(latestCategories),
    },
    {
      title: "Comparatifs",
      links: toPageLinks(latestComparatifs),
    },
  ].filter((block) => block.links.length > 0);

  return (
    <footer className="mt-14 border-t border-ring bg-surface/70 clean-links">
      <div className="brand-gradient h-1 w-full" />

      {trustItems.length > 0 ? (
        <section className="border-b border-ring bg-brand-50/50">
          <div className="container-page py-7">
            <h2 className="text-lg font-bold tracking-tight text-slate-950">
              {trustTitle}
            </h2>

            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {trustItems.slice(0, 4).map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
                >
                  <span className="mr-2 text-brand-700">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="container-page py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoSrc}
                  alt={logoAlt}
                  className="h-10 w-auto max-w-[180px] object-contain"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="text-base font-black text-slate-950">
                  {siteName}
                </span>
              )}
            </Link>

            {tagline ? (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {tagline}
              </p>
            ) : null}
          </div>

          <FooterColumn title="Catégories" links={categoryLinks} />
          <FooterColumn title="Guides" links={guideLinks} fallbackLink={{ href: "/pages", label: "Tous les guides" }} />
          <FooterColumn title="Marques" links={brandLinks} fallbackLink={{ href: "/marques", label: "Toutes les marques" }} />
          <FooterColumn title="Comparatifs" links={comparatifLinks} />
        </div>
      </section>

      {explorerBlocks.length > 0 ? (
        <section className="border-t border-ring bg-white/70">
          <div className="container-page py-8">
            <h2 className="text-base font-black text-slate-950">
              Explorer {siteName}
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {explorerBlocks.map((block) => (
                <div
                  key={block.title}
                  className="rounded-3xl border border-ring bg-surface/60 p-5"
                >
                  <h3 className="text-sm font-bold text-slate-950">
                    {block.title}
                  </h3>

                  <ul className="mt-3 space-y-2 text-sm">
                    {block.links.map((link) => (
                      <li key={`${block.title}-${link.href}`}>
                        <Link className="text-slate-600 hover:text-brand-700" href={link.href}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="border-t border-ring">
        <div className="container-page flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-xs leading-5 text-slate-600">
            © {year} {copyright}
          </p>

          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <li>
              <Link className="text-slate-600 hover:text-brand-700" href="/mentions-legales">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link className="text-slate-600 hover:text-brand-700" href="/confidentialite">
                Confidentialité
              </Link>
            </li>
            <li>
              <Link className="text-slate-600 hover:text-brand-700" href="/cookies">
                Cookies
              </Link>
            </li>
            <li>
              <Link className="text-slate-600 hover:text-brand-700" href="/cgu">
                CGU
              </Link>
            </li>
            <li>
              <Link className="text-slate-600 hover:text-brand-700" href="/contact">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}