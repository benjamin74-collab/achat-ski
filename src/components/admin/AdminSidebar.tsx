// src/components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

type NavItem = {
  href: string;
  label: string;
  desc?: string;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      {
        href: "/admin",
        label: "Tableau de bord",
        desc: "Vue d’ensemble",
      },
    ],
  },
  {
    title: "Catalogue",
    items: [
      {
        href: "/admin/categories",
        label: "Catégories",
        desc: "Texte, structure et SEO",
      },
      {
        href: "/admin/brands",
        label: "Marques",
        desc: "Ajouter, modifier, supprimer",
      },
	  {
		href: "/admin/affiliation",
		label: "Marchands & affiliation",
		desc: "Réseaux, marchands et programmes",
	  },
      {
        href: "/admin/feeds",
        label: "Flux d’affiliation",
        desc: "Imports, mappings et historique",
      },
	  {
	    href: "/admin/classification",
	    label: "Classification",
	    desc: "Règles d'enrichissement"
	  },
    ],
  },
  {
    title: "Contenu",
    items: [
      {
        href: "/admin/pages",
        label: "Pages",
        desc: "Pages statiques, articles et guides",
      },
      {
        href: "/admin/guide-categories",
        label: "Catégories de guides",
        desc: "Classement et menu Guides",
      },
      {
        href: "/admin/reviews",
        label: "Avis",
        desc: "Créer, lister et modérer",
      },
      {
        href: "/admin/tests",
        label: "Tests",
        desc: "Lier les tests aux produits",
      },
      {
        href: "/admin/test-rating-categories",
        label: "Catégories de notes",
        desc: "Critères d’évaluation des tests",
      },
    ],
  },
  {
    title: "Apparence",
    items: [
      {
        href: "/admin/design",
        label: "Design",
        desc: "Identité, couleurs et polices",
      },
      {
        href: "/admin/content",
        label: "Contenus du site",
        desc: "Textes propres à chaque site",
      },
    ],
  },
  {
    title: "Monétisation",
    items: [
      {
        href: "/admin/monetization/adsense",
        label: "Adsense",
        desc: "Publicités Google",
      },
      {
        href: "/admin/marketing/tracking",
        label: "Tracking",
        desc: "GA4, Google Ads et GTM",
      },
    ],
  },
  {
    title: "Légal",
    items: [
      {
        href: "/admin/cookies",
        label: "Cookies (RGPD)",
        desc: "Consentement et liste des cookies",
      },
      {
        href: "/admin/legal-pages",
        label: "Pages légales",
        desc: "Mentions, confidentialité, CGU et contact",
      },
    ],
  },
  {
    title: "Médias",
    items: [
      {
        href: "/admin/media",
        label: "Médiathèque",
        desc: "Uploader et gérer les images",
      },
    ],
  },
];

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const userLabel = (
    session?.user?.name ||
    session?.user?.email ||
    "Compte admin"
  ) as string;

  return (
    <nav className="space-y-3">
      <div className="rounded-2xl border border-ring bg-white p-3 shadow-card">
        <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Administration
        </div>

        <div className="mt-2 space-y-4">
          {NAV_SECTIONS.map((section, sectionIndex) => (
            <div
              key={section.title ?? `section-${sectionIndex}`}
              className={
                sectionIndex > 0
                  ? "border-t border-slate-100 pt-4"
                  : undefined
              }
            >
              {section.title ? (
                <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {section.title}
                </div>
              ) : null}

              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active = isNavItemActive(pathname, item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`block rounded-xl px-3 py-2 transition ${
                          active
                            ? "bg-brand-500 text-white shadow-sm"
                            : "text-ink hover:bg-muted"
                        }`}
                      >
                        <div className="text-sm font-medium">{item.label}</div>

                        {item.desc ? (
                          <div
                            className={`mt-0.5 text-xs leading-4 ${
                              active ? "text-white/80" : "text-slate-500"
                            }`}
                          >
                            {item.desc}
                          </div>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-ring bg-white p-3">
        <div className="text-xs leading-5 text-slate-500">
          Astuce : utilisez la recherche du header pour retrouver rapidement un
          produit à lier à un test.
        </div>
      </div>

      <div className="rounded-2xl border border-ring bg-white p-3">
        <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Compte
        </div>

        {status === "loading" ? (
          <div className="mt-2 h-9 w-full animate-pulse rounded-lg bg-muted" />
        ) : (
          <div className="mt-2 space-y-2">
            <div className="truncate px-2 text-sm font-medium text-slate-800">
              {userLabel}
            </div>

            <button
              type="button"
              className="btn-outline w-full justify-center"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}