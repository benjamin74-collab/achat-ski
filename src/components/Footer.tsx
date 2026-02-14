"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type FooterPack = {
  siteLabel: string; // H3 Bloc 1
  intro: string; // paragraphe Bloc 1
  categories: Array<{ href: string; label: string }>; // Bloc 2
  about: Array<{ href: string; label: string }>; // Bloc 3
  newsletterIntro: string; // Bloc 4
  legal: Array<{ href: string; label: string }>; // ✅ bas de page (multi-site)
  copyright: string; // bas de page
};

const year = new Date().getFullYear();

const FOOTER_PACKS: Record<string, FooterPack> = {
  "meilleur-ski": {
    siteLabel: "Meilleur-Ski",
    intro:
      "Compare les prix du matériel de ski (skis, fixations, chaussures) chez des marchands partenaires sélectionnés. Objectif : trouver le meilleur prix, rapidement.",
    categories: [
      { href: "/c/skis-all-mountain", label: "Skis All-Mountain" },
      { href: "/c/skis-freeride", label: "Skis Freeride" },
      { href: "/c/skis-rando", label: "Skis de rando" },
      { href: "/c/fixations", label: "Fixations" },
      { href: "/c/chaussures", label: "Chaussures" },
    ],
    about: [
      { href: "/a-propos", label: "Qui sommes-nous ?" },
      { href: "/partenaires", label: "Marchands & partenaires" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
    newsletterIntro: "Bons plans & promos ski — 1 à 2 fois par mois.",
    legal: [
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/confidentialite", label: "Confidentialité" },
      { href: "/cookies", label: "Cookies" },
      { href: "/cgu", label: "CGU" },
    ],
    copyright:
      "Meilleur-ski.com — Certains liens sont affiliés. Prix susceptibles d’évolution.",
  },

  "meilleur-robot": {
    siteLabel: "Meilleur-Robot",
    intro:
      "Compare les prix et consulte des guides pour choisir le meilleur robot (aspirateur, cuisine, tondeuse, piscine…). Objectif : le bon modèle au bon prix.",
    categories: [
      { href: "/c/robots-aspirateurs", label: "Robots aspirateurs" },
      { href: "/c/robots-cuisine", label: "Robots de cuisine" },
      { href: "/c/robots-tondeuse", label: "Robots tondeuse" },
      { href: "/c/robots-piscine", label: "Robots piscine" },
      { href: "/c/robots-lave-vitres", label: "Robots lave-vitres" },
    ],
    about: [
      { href: "/a-propos", label: "Qui sommes-nous ?" },
      { href: "/partenaires", label: "Marchands & partenaires" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
    newsletterIntro: "Bons plans & promos robots — 1 à 2 fois par mois.",
    legal: [
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/confidentialite", label: "Confidentialité" },
      { href: "/cookies", label: "Cookies" },
      { href: "/cgu", label: "CGU" },
    ],
    copyright:
      "Meilleur-robot.com — Certains liens sont affiliés. Prix susceptibles d’évolution.",
  },
};

export default function Footer() {
  const [siteId, setSiteId] = useState<string>("meilleur-ski");

  useEffect(() => {
    const id = document.documentElement.dataset.siteId;
    if (id) setSiteId(id);
  }, []);

  const pack = useMemo(
    () => FOOTER_PACKS[siteId] ?? FOOTER_PACKS["meilleur-ski"],
    [siteId]
  );

  return (
    <footer className="mt-12 border-t border-ring bg-surface/60 clean-links">
      {/* Bandeau haut coloré */}
      <div className="brand-gradient h-1 w-full" />

      {/* Grille principale */}
      <div className="container-page py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Bloc 1 */}
          <div>
            <h3 className="text-sm font-semibold text-ink">{pack.siteLabel}</h3>
            <p className="mt-3 text-sm text-slate-600">{pack.intro}</p>
          </div>

          {/* Bloc 2 */}
          <div>
            <h3 className="text-sm font-semibold text-ink">Catégories</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {pack.categories.map((c) => (
                <li key={c.href}>
                  <Link className="hover:text-brand-600" href={c.href}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Bloc 3 */}
          <div>
            <h3 className="text-sm font-semibold text-ink">À propos</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {pack.about.map((a) => (
                <li key={a.href}>
                  <Link className="hover:text-brand-600" href={a.href}>
                    {a.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Bloc 4 : newsletter (placeholder) */}
          <div>
            <h3 className="text-sm font-semibold text-ink">Newsletter</h3>
            <p className="mt-3 text-sm text-slate-600">{pack.newsletterIntro}</p>
            <form
              className="mt-3 flex items-center gap-2"
              action="/api/newsletter"
              method="POST"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="votre@email.com"
                className="w-full rounded-xl border border-ring bg-white px-3 py-2 text-sm"
              />
              <button className="btn" type="submit">
                S’inscrire
              </button>
            </form>
            <p className="mt-2 text-[12px] text-slate-500">
              Vous pouvez vous désinscrire à tout moment.
            </p>
          </div>
        </div>
      </div>

      {/* Bas de page */}
      <div className="border-t border-ring">
        <div className="container-page flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-slate-600">© {year} {pack.copyright}</p>

          <ul className="flex flex-wrap items-center gap-3 text-xs">
            {pack.legal.map((l) => (
              <li key={l.href}>
                <Link className="hover:text-brand-600" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
