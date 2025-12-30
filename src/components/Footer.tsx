"use client";

import Link from "next/link";

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-ring bg-surface/60 clean-links">
      {/* Bandeau haut coloré */}
      <div className="brand-gradient h-1 w-full" />

      {/* Grille principale */}
      <div className="container-page py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Bloc 1 */}
          <div>
            <h3 className="text-sm font-semibold text-ink">Meilleur-ski</h3>
            <p className="mt-3 text-sm text-slate-600">
              Compare les prix du matériel de ski (skis, fixations, chaussures) chez des marchands
              partenaires sélectionnés. Objectif : trouver le meilleur prix, rapidement.
            </p>
          </div>

          {/* Bloc 2 */}
          <div>
            <h3 className="text-sm font-semibold text-ink">Catégories</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link className="hover:text-brand-600" href="/c/skis-all-mountain">
                  Skis All-Mountain
                </Link>
              </li>
              <li>
                <Link className="hover:text-brand-600" href="/c/skis-freeride">
                  Skis Freeride
                </Link>
              </li>
              <li>
                <Link className="hover:text-brand-600" href="/c/skis-rando">
                  Skis de rando
                </Link>
              </li>
              <li>
                <Link className="hover:text-brand-600" href="/c/fixations">
                  Fixations
                </Link>
              </li>
              <li>
                <Link className="hover:text-brand-600" href="/c/chaussures">
                  Chaussures
                </Link>
              </li>
            </ul>
          </div>

          {/* Bloc 3 */}
          <div>
            <h3 className="text-sm font-semibold text-ink">À propos</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link className="hover:text-brand-600" href="/a-propos">
                  Qui sommes-nous ?
                </Link>
              </li>
              <li>
                <Link className="hover:text-brand-600" href="/partenaires">
                  Marchands & partenaires
                </Link>
              </li>
              <li>
                <Link className="hover:text-brand-600" href="/faq">
                  FAQ
                </Link>
              </li>
              <li>
                <Link className="hover:text-brand-600" href="/contact">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Bloc 4 : newsletter (placeholder) */}
          <div>
            <h3 className="text-sm font-semibold text-ink">Newsletter</h3>
            <p className="mt-3 text-sm text-slate-600">
              Bons plans & promos ski — 1 à 2 fois par mois.
            </p>
            <form
              className="mt-3 flex items-center gap-2"
              action="/api/newsletter"
              method="POST"
              // onSubmit placeholder supprimé pour éviter warning ESLint
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
          <p className="text-xs text-slate-600">
            © {year} Meilleur-ski.com — Certains liens sont affiliés. Prix susceptibles d’évolution.
          </p>
          <ul className="flex flex-wrap items-center gap-3 text-xs">
            <li>
              <Link className="hover:text-brand-600" href="/mentions-legales">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand-600" href="/confidentialite">
                Confidentialité
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand-600" href="/cookies">
                Cookies
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand-600" href="/cgu">
                CGU
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
