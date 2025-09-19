import Link from "next/link";
import { prisma } from "../lib/prisma";

export default async function Home() {
  const site = process.env.NEXT_PUBLIC_SITE_NAME ?? "Achat-Ski";
  const latest = await prisma.product.findMany({ take: 6, orderBy: { id: "desc" } });

  return (
    <div className="container-page py-10">
      <section className="card p-8 md:p-12">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          {site} — comparateur de prix ski
        </h1>
        <p className="mt-3 text-neutral-600 max-w-2xl">
          Comparez instantanément les prix du matériel de ski (skis, fixations, chaussures,
          accessoires) chez Ekosport, Snowleader, Glisshop et d’autres marchands.
        </p>

        <form action="/recherche" className="mt-6 flex gap-2">
          <input
            name="q"
            placeholder="Rechercher un modèle (ex. Atomic Bent 100)"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:ring"
          />
          <button type="submit" className="btn">Rechercher</button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Catégories populaires</h2>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/c/skis-all-mountain", label: "Skis All-Mountain" },
            { href: "/c/skis-rando", label: "Ski de rando" },
            { href: "/c/fixations", label: "Fixations" },
            { href: "/c/chaussures", label: "Chaussures" },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="card p-4 hover:bg-neutral-50">{c.label}</Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Nouveautés</h2>
        <ul className="mt-3 list-disc pl-6">
          {latest.map(p => (
            <li key={p.id}>
              <Link className="underline" href={`/p/${p.slug}`}>
                {p.brand} {p.model} {p.season}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
