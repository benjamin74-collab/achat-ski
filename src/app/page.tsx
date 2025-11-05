import Link from "next/link";
import { Search } from "lucide-react";

// eslint-disable-next-line @next/next/no-img-element
export default function HomePage() {
  const cats = [
    { href: "/c/skis-all-mountain", label: "Skis All-Mountain" },
    { href: "/c/skis-freeride", label: "Skis Freeride" },
    { href: "/c/skis-rando", label: "Skis Rando" },
    { href: "/c/fixations", label: "Fixations" },
    { href: "/c/chaussures", label: "Chaussures" },
  ];

  const topBrands = [
    {
      name: "Rossignol",
      slug: "rossignol",
      logo: "https://logos-marques.com/wp-content/uploads/2023/01/Rossignol-emblem.png",
    },
    {
      name: "Salomon",
      slug: "salomon",
      logo: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Salomon_group_logo.png",
    },
    {
      name: "Head",
      slug: "head",
      logo: "https://www.head.com/HeadV2Logo-iGF.svg",
    },
    {
      name: "Black Crows",
      slug: "black-crows",
      logo: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_Black_Crows.svg",
    },
    {
      name: "Atomic",
      slug: "atomic",
      logo: "https://upload.wikimedia.org/wikipedia/commons/0/04/Atomic_ski_logo.png",
    },
  ];

  return (
    <main className="pb-20">
      {/* ---------------- HERO (mobile-friendly) ---------------- */}
      <section className="relative overflow-hidden py-14 md:py-20 text-center bg-gradient-to-b from-white to-muted/60">
        <div className="container-page relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-ink tracking-tight">
            Le{" "}
            <span className="text-brand-600">comparateur</span>{" "}
            des passionnés de ski
          </h1>

          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 max-w-[28rem] sm:max-w-2xl mx-auto px-2">
            Comparez les prix, consultez les tests et les avis pour trouver le matériel parfait.
          </p>

          {/* Barre de recherche — plus compacte sur mobile */}
          <form action="/search" className="mt-6 sm:mt-8 max-w-xl mx-auto px-3 sm:px-0">
            <div className="relative shadow-sm sm:shadow-md">
              <input
                name="q"
                placeholder="Ex : Salomon QST 98, Atomic Maverick 88…"
                className="w-full rounded-xl bg-white border border-ring px-4 sm:px-5 py-2.5 sm:py-3 pr-12 sm:pr-14 text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm sm:text-base"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 sm:right-2 sm:top-1.5 flex items-center gap-1 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-semibold"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Rechercher</span>
              </button>
            </div>
          </form>

          {/* Catégories rapides — chips scrollables en mobile */}
          <div className="mt-5 sm:mt-6">
            <div className="no-scrollbar mx-auto flex max-w-full gap-2 overflow-x-auto px-3 sm:px-0 sm:flex-wrap sm:justify-center snap-x snap-mandatory">
              {cats.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="snap-start text-xs md:text-sm rounded-full border border-ring bg-white hover:bg-muted text-ink px-3 py-2 transition shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  {c.label}
                </Link>
              ))}

              {/* ✅ Chip vers l'annuaire des marques */}
              <Link
                href="/marques"
                className="snap-start text-xs md:text-sm rounded-full border border-brand-500 bg-white hover:bg-brand-50 text-brand-600 px-3 py-2 transition shadow-sm hover:shadow-md whitespace-nowrap"
                aria-label="Accéder à l’annuaire des marques"
              >
                🧭 Annuaire des marques
              </Link>
            </div>

            {/* ✅ Bouton central (CTA secondaire) */}
            <div className="mt-4 sm:mt-5 flex justify-center">
              <a
                href="/marques"
                className="inline-flex items-center gap-2 rounded-xl border border-ring bg-white hover:bg-muted text-ink px-4 py-2 text-sm shadow-sm hover:shadow-md"
              >
                🧭 Explorer l’annuaire des marques
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- VALEURS ---------------- */}
      <section className="mt-12 md:mt-16 container-page text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-ink mb-6 sm:mb-8">
          Pourquoi choisir <span className="text-brand-600">Meilleur-ski</span> ?
        </h2>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <div className="card py-6 sm:py-8 px-4">
            <div className="text-brand-500 text-2xl sm:text-3xl mb-2 sm:mb-3">🎿</div>
            <h3 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Comparateur spécialisé</h3>
            <p className="text-sm text-slate-600">
              Nous comparons uniquement du matériel de ski, sélectionné chez les meilleurs revendeurs.
            </p>
          </div>

          <div className="card py-6 sm:py-8 px-4">
            <div className="text-sec-500 text-2xl sm:text-3xl mb-2 sm:mb-3">⭐</div>
            <h3 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Tests & avis authentiques</h3>
            <p className="text-sm text-slate-600">
              Retrouvez des retours vérifiés de passionnés pour faire le bon choix.
            </p>
          </div>

          <div className="card py-6 sm:py-8 px-4">
            <div className="text-accent-500 text-2xl sm:text-3xl mb-2 sm:mb-3">💰</div>
            <h3 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Les meilleurs prix</h3>
            <p className="text-sm text-slate-600">
              Comparez en temps réel les offres Ekosport, Snowleader, Glisshop et plus encore.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- TOP MARQUES ---------------- */}
      <section className="mt-14 md:mt-18 container-page">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-ink">Top marques</h2>
          <a href="/marques" className="text-sm underline text-brand-600 hover:text-brand-700">
            Voir tout l’annuaire
          </a>
        </div>

        <ul className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {topBrands.map((b) => (
            <li key={b.slug} className="group">
              <a
                href={`/marques/${b.slug}`}
                className="block rounded-2xl border border-ring bg-white p-4 sm:p-5 hover:shadow-card transition"
                aria-label={`Voir la marque ${b.name}`}
                title={b.name}
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted/40 flex items-center justify-center">
                  <img
                    src={b.logo}
                    alt={b.name}
                    className="max-h-14 sm:max-h-16 w-auto object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="mt-2 text-center text-sm font-medium text-ink group-hover:underline">
                  {b.name}
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
