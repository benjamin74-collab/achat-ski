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
      <section className="section-hero relative overflow-hidden py-20 text-center text-white">
        <div className="container-page relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Le <span className="text-sec-400">comparateur</span> des passionnés de ski
          </h1>
          <p className="mt-4 text-lg text-slate-200 max-w-2xl mx-auto">
            Comparez les prix, consultez les tests et les avis pour trouver le matériel parfait.
          </p>

          {/* Barre de recherche */}
          <form action="/search" className="mt-8 max-w-xl mx-auto">
            <div className="relative shadow-xl">
              <input
                name="q"
                placeholder="Ex : Salomon QST 98, Atomic Maverick 88…"
                className="w-full rounded-xl bg-white/95 border border-ring px-5 py-3 pr-14 text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                className="text-xs md:text-sm rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-3 py-2 hover:bg-white/20 transition"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Dégradé décoratif */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-600 via-sec-600/70 to-ink/90 opacity-80" />
        <div className="absolute inset-0 bg-[url('/textures/snow-pattern.png')] bg-cover opacity-5" />
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
