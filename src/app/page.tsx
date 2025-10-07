import Link from "next/link";

export default function HomePage() {
  const cats = [
    { href: "/c/skis-all-mountain", label: "Skis All-Mountain" },
    { href: "/c/skis-freeride", label: "Skis Freeride" },
    { href: "/c/skis-rando", label: "Skis Rando" },
    { href: "/c/fixations", label: "Fixations" },
    { href: "/c/chaussures", label: "Chaussures" },
  ];

  return (
    <main className="py-10">
      <section className="rounded-2xl border border-ring bg-card/60 p-8 shadow-card">
        <h1 className="text-3xl md:text-4xl font-semibold">
          Le <span className="text-brand-400">comparateur</span> des passionnés de ski
        </h1>
        <p className="mt-3 text-slate-300 max-w-2xl">
          Comparez les prix en temps réel et retrouvez tests & avis pour choisir en confiance.
        </p>
        <form action="/search" className="mt-6 max-w-xl">
          <div className="relative">
            <input
              name="q"
              placeholder="Ex: Salomon QST 98, Atomic Maverick 88…"
              className="w-full rounded-xl bg-surface/70 border border-ring px-4 py-3 pr-24 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button className="absolute right-1 top-1 rounded-lg px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white">
              Rechercher
            </button>
          </div>
        </form>
        <div className="mt-6 flex flex-wrap gap-2">
          {cats.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="text-xs md:text-sm rounded-lg border border-ring px-3 py-2 bg-surface/60 hover:bg-surface"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
