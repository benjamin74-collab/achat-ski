import Link from "next/link";
import { Search } from "lucide-react";

export default function HomePage() {
  const cats = [
    { href: "/c/skis-all-mountain", label: "Skis All-Mountain" },
    { href: "/c/skis-freeride", label: "Skis Freeride" },
    { href: "/c/skis-rando", label: "Skis Rando" },
    { href: "/c/fixations", label: "Fixations" },
    { href: "/c/chaussures", label: "Chaussures" },
  ];

  return (
    <main className="pb-20">
      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden py-20 text-center bg-gradient-to-b from-white to-muted/60">
        <div className="container-page relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight text-ink">
            Le{" "}
            <span className="text-brand-600">comparateur</span>{" "}
            des passionnés de ski
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Comparez les prix, consultez les tests et les avis pour trouver le matériel parfait.
          </p>

          {/* Barre de recherche */}
          <form action="/search" className="mt-8 max-w-xl mx-auto">
            <div className="relative shadow-md">
              <input
                name="q"
                placeholder="Ex : Salomon QST 98, Atomic Maverick 88…"
                className="w-full rounded-xl bg-white border border-ring px-5 py-3 pr-14 text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1.5 flex items-center gap-1 rounded-lg px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold"
              >
                <Search className="h-4 w-4" />
                Rechercher
              </button>
            </div>
          </form>

          {/* Catégories rapides */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {cats.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="text-xs md:text-sm rounded-full border border-ring bg-white hover:bg-muted text-ink px-3 py-2 transition shadow-sm hover:shadow-md"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- VALEURS ---------------- */}
      <section className="mt-16 container-page text-center">
        <h2 className="text-2xl font-bold text-ink mb-8">
          Pourquoi choisir <span className="text-brand-600">Meilleur-ski</span> ?
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          <div className="card py-8">
            <div className="text-brand-500 text-3xl mb-3">🎿</div>
            <h3 className="font-semibold text-lg mb-2">Comparateur spécialisé</h3>
            <p className="text-sm text-slate-600">
              Nous comparons uniquement du matériel de ski, sélectionné chez les meilleurs revendeurs.
            </p>
          </div>

          <div className="card py-8">
            <div className="text-sec-500 text-3xl mb-3">⭐</div>
            <h3 className="font-semibold text-lg mb-2">Tests & avis authentiques</h3>
            <p className="text-sm text-slate-600">
              Retrouvez des retours vérifiés de passionnés pour faire le bon choix.
            </p>
          </div>

          <div className="card py-8">
            <div className="text-accent-500 text-3xl mb-3">💰</div>
            <h3 className="font-semibold text-lg mb-2">Les meilleurs prix</h3>
            <p className="text-sm text-slate-600">
              Comparez en temps réel les offres Ekosport, Snowleader, Glisshop et plus encore.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
