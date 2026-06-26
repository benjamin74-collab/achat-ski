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
  finalLink,
}: {
  title: string;
  links: FooterLink[];
  finalLink: FooterLink;
}) {
  const finalLinks = [...links.slice(0, 5), finalLink];

  return (
    <div>
      <h3 className="text-base font-black tracking-tight text-slate-950">
        {title}
      </h3>

      <ul className="mt-4 space-y-3 text-sm">
        {finalLinks.map((link, index) => (
          <li key={`${title}-${link.href}`}>
            <Link
              className={
                index === finalLinks.length - 1
                  ? "font-semibold text-brand-700 transition hover:text-brand-800"
                  : "text-slate-600 transition hover:text-brand-700"
              }
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

export default async function Footer() {
  const siteId = await getCurrentSiteId();
  const siteConfig = getSiteConfig(siteId);

  const [
    settings,
    footerCategories,
    footerBrands,
    latestGuides,
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
      take: 5,
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
      take: 5,
      select: {
        name: true,
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
  ]);

  const siteName = settings?.name || siteConfig.name;
  const tagline = settings?.tagline || siteConfig.tagline;
  const logoSrc = settings?.logoSrc || siteConfig.brand.logoSrc;
  const logoAlt = settings?.logoAlt || siteName;

  const trustItems = asTrustItems(settings?.footerTrustItems);
  const copyright =
    settings?.footerCopyright ||
    `${siteName} — Certains liens peuvent être affiliés. Prix susceptibles d’évolution.`;

  const guideLinks = toPageLinks(latestGuides);
  const brandLinks = toBrandLinks(footerBrands);
  const categoryLinks = toCategoryLinks(footerCategories);

  return (
    <footer className="mt-16 clean-links">
      <div className="brand-gradient h-1 w-full" />

      <section className="border-t border-slate-200 bg-brand-50/40">
        <div className="container-page py-10 md:py-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.45fr_1fr_1fr_1fr] lg:gap-12">
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoSrc}
                    alt={logoAlt}
                    className="h-11 w-auto max-w-[52px] object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}

                <span className="text-2xl font-black tracking-tight text-brand-700">
                  {siteName}
                </span>
              </Link>

              {tagline ? (
                <p className="mt-5 max-w-sm text-sm leading-7 text-slate-700">
                  {tagline}
                </p>
              ) : null}

              {trustItems.length > 0 ? (
                <ul className="mt-6 space-y-3">
                  {trustItems.slice(0, 4).map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm font-medium text-slate-800">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-black text-white">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-8 border-t border-slate-200 pt-6">
                <h2 className="text-lg font-black tracking-tight text-slate-950">
                  Explorer {siteName}
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
                  Retrouvez les derniers guides, les marques populaires et les principales catégories du site.
                </p>
              </div>
            </div>

            <FooterColumn
              title="Guides"
              links={guideLinks}
              finalLink={{ href: "/pages", label: "Tous les guides" }}
            />

            <FooterColumn
              title="Marques"
              links={brandLinks}
              finalLink={{ href: "/marques", label: "Toutes les marques" }}
            />

            <FooterColumn
              title="Catégories"
              links={categoryLinks}
              finalLink={{ href: "/#categories", label: "Toutes les catégories" }}
            />
          </div>
        </div>
      </section>

      <div className="border-t border-slate-200 bg-white">
        <div className="container-page flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            © {year} {copyright}
          </p>

          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <li>
              <Link className="text-slate-500 hover:text-brand-700" href="/mentions-legales">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link className="text-slate-500 hover:text-brand-700" href="/confidentialite">
                Confidentialité
              </Link>
            </li>
            <li>
              <Link className="text-slate-500 hover:text-brand-700" href="/cookies">
                Cookies
              </Link>
            </li>
            <li>
              <Link className="text-slate-500 hover:text-brand-700" href="/cgu">
                CGU
              </Link>
            </li>
            <li>
              <Link className="text-slate-500 hover:text-brand-700" href="/contact">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}