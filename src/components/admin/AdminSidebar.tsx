// src/components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

type Item = { href: string; label: string; desc?: string };

const NAV: Item[] = [
  { href: "/admin", label: "Tableau de bord", desc: "Vue d’ensemble" },
  { href: "/admin/reviews", label: "Avis", desc: "Créer, lister, modérer" },
  { href: "/admin/tests", label: "Tests", desc: "Lier aux produits" },
  { href: "/admin/test-rating-categories", label: "Catégories de notes", desc: "Types de critères pour les tests" },
  { href: "/admin/categories", label: "Catégories", desc: "Texte + SEO" },
  { href: "/admin/brands", label: "Marques", desc: "Ajouter, modifier, supprimer" },
  { href: "/admin/pages", label: "Pages", desc: "Pages statiques / blog" },
  { href: "/admin/media", label: "Médiathèque", desc: "Uploader & gérer les images" },
  { href: "/admin/cookies", label: "Cookies (RGPD)", desc: "Consentement & liste des cookies" },
  { href: "/admin/design", label: "Design", desc: "Branding & homepage" },
  // on ajoutera “Menu builder” une fois la hiérarchie de catégories en place
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const userLabel = (session?.user?.name || session?.user?.email || "Compte admin") as string;

  return (
    <nav className="space-y-2">
      <div className="rounded-2xl border border-ring bg-white p-3 shadow-card">
        <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Administration</div>
        <ul className="mt-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-xl px-3 py-2 transition ${
                    active ? "bg-brand-500 text-white" : "text-ink hover:bg-muted"
                  }`}
                >
                  <div className="text-sm font-medium">{item.label}</div>
                  {item.desc ? (
                    <div className={`text-xs ${active ? "text-white/80" : "text-slate-500"}`}>{item.desc}</div>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-2xl border border-ring bg-white p-3">
        <div className="text-xs text-slate-500">
          Astuce : utilisez la recherche du header pour retrouver rapidement un produit à lier à un test.
        </div>
      </div>

      {/* Bloc compte + déconnexion (uniquement backoffice) */}
      <div className="rounded-2xl border border-ring bg-white p-3">
        <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Compte</div>

        {status === "loading" ? (
          <div className="mt-2 h-9 w-full rounded-lg bg-muted animate-pulse" />
        ) : (
          <div className="mt-2 space-y-2">
            <div className="px-2 text-sm font-medium text-slate-800 truncate">{userLabel}</div>

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