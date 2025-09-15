export default function Home() {
  const site = process.env.NEXT_PUBLIC_SITE_NAME ?? "Achat-Ski";
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      {/* Hero */}
      <section className="rounded-2xl border p-8 md:p-12 bg-white">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          {site} — comparateur de prix ski
        </h1>
        <p className="mt-3 text-neutral-600 max-w-2xl">
          Comparez instantanément les prix du matériel de ski (skis, fixations, chaussures,
          accessoires) chez Ekosport, Snowleader, Glisshop et d’autres marchands.
        </p>

        {/* Barre de recherche (placeholder pour le MVP) */}
        <div className="mt-6">
          <form action="/recherche" className="flex gap-2">
            <input
              name="q"
              placeholder="Rechercher un modèle (ex. Atomic Bent 100)"
              className="w-full rounded-xl border px-4 py-3 outline-none focus:ring"
            />
            <button
              type="submit"
              className="rounded-xl border px-5 py-3 font-medium hover:bg-neutral-50"
            >
              Rechercher
            </button>
          </form>
          <p className="mt-2 text-sm text-neutral-500">
            Démo : le moteur sera branché plus tard (Meilisearch). Pour l’instant, ce champ redirige.
          </p>
        </div>
      </section>

      {/* Catégories (liens statiques pour commencer) */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Catégories populaires</h2>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/c/skis-all-mountain", label: "Skis All-Mountain" },
            { href: "/c/skis-rando", label: "Ski de rando" },
            { href: "/c/fixations", label: "Fixations" },
            { href: "/c/chaussures", label: "Chaussures" },
          ].map((c) => (
            <a key={c.href} href={c.href} className="rounded-xl border p-4 hover:bg-neutral-50">
              {c.label}
            </a>
          ))}
        </div>
      </section>

      {/* Encadré comparateur (explication + disclosure) */}
      <section className="mt-10 rounded-2xl border p-6 bg-white">
        <h3 className="text-lg font-semibold">Comment ça marche ?</h3>
        <ol className="mt-2 list-decimal pl-5 text-neutral-700 space-y-1">
          <li>Nous collectons les offres des marchands partenaires.</li>
          <li>Nous affichons les prix, la dispo et le coût de livraison quand disponible.</li>
          <li>Vous cliquez sur l’offre la moins chère et achetez chez le marchand.</li>
        </ol>
        <p className="mt-3 text-xs text-neutral-500">
          {process.env.NEXT_PUBLIC_AFFILIATE_DISCLOSURE ??
            "Certains liens sont des liens affiliés."}
        </p>
      </section>
    </main>
  );
}
