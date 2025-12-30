// src/app/page.tsx
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

type CategoryTile = {
  slug: string;
  title: string;
  desc: string;
  cta: string;
  img: string; // chemin dans /public
};

const categoryTiles: CategoryTile[] = [
  {
    slug: "skis-all-mountain",
    title: "Skis All-Mountain",
    desc: "Le meilleur compromis piste / hors-piste pour 80% des skieurs.",
    cta: "Comparer les All-Mountain",
    img: "/categories/skis-all-mountain.jpg",
  },
  {
    slug: "skis-freeride",
    title: "Skis Freeride",
    desc: "Flottaison et stabilité : l’outil parfait quand il a neigé.",
    cta: "Voir les Freeride",
    img: "/categories/skis-freeride.jpg",
  },
  {
    slug: "skis-rando",
    title: "Skis de rando",
    desc: "Léger à la montée, sûr à la descente : optimise ton set-up.",
    cta: "Explorer la rando",
    img: "/categories/skis-rando.jpg",
  },
  {
    slug: "fixations",
    title: "Fixations",
    desc: "Alpine, rando, hybrides : compare les offres et la compatibilité.",
    cta: "Comparer les fixations",
    img: "/categories/fixations.jpg",
  },
  {
    slug: "chaussures",
    title: "Chaussures",
    desc: "Confort et précision : le choix n°1 pour progresser.",
    cta: "Trouver ses chaussures",
    img: "/categories/chaussures.jpg",
  },
];

export default async function HomePage() {
  // Derniers guides (SEO + perf : rendu server-side)
  const latestGuides = await prisma.page.findMany({
    where: { published: true, kind: "GUIDE" },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      slug: true,
      title: true,
      intro: true,
      thumbnailUrl: true,
      createdAt: true,
    },
  });

  // Bloc marques (on le laisse tel quel, déplacé en bas)
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
      {/* ---------------- HERO (sans search) ---------------- */}
      <section className="relative overflow-hidden py-14 md:py-20 text-center bg-gradient-to-b from-white to-muted/60">
        <div className="container-page relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-ink tracking-tight">
            Le <span className="text-brand-600">comparateur</span> des passionnés de ski
          </h1>

          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 max-w-[28rem] sm:max-w-2xl mx-auto px-2">
            Comparez les prix, consultez les tests et les avis pour trouver le matériel parfait.
          </p>

          {/* CTA hero : SEO + UX (évite le doublon search) */}
          <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 px-3 sm:px-0">
            <Link href="/search" className="btn w-full sm:w-auto">
              Rechercher un modèle
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#categories" className="btn-outline w-full sm:w-auto">
              Explorer les catégories
            </Link>
            <Link href="/pages" className="btn-outline w-full sm:w-auto">
              Lire nos guides
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- CATEGORIES (vignettes) ---------------- */}
      <section id="categories" className="mt-12 md:mt-16 container-page">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-ink">
            Catégories populaires
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            Des pages catégories pensées pour la performance : prix à jour, filtres utiles et contenu d’aide au choix.
          </p>
        </div>

		<ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
		  {categoryTiles.map((c) => (
			<li key={c.slug} className="group">
			  <Link
				href={`/c/${c.slug}`}
				className="block card overflow-hidden hover:shadow-card transition"
				aria-label={`Voir la catégorie ${c.title}`}
			  >
				<div className="relative aspect-[16/9] w-full bg-muted">
				  {/* Image : à placer dans /public/categories/... (sinon fond neutre) */}
				  {c.img ? (
					<img
					  src={c.img}
					  alt={c.title}
					  className="h-full w-full object-cover"
					  loading="lazy"
					/>
				  ) : (
					<div className="h-full w-full bg-gradient-to-br from-muted to-white" />
				  )}

				  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
				</div>

				<div className="p-5">
				  <h3 className="text-base font-semibold text-ink">{c.title}</h3>
				  <p className="mt-1 text-sm text-slate-600 line-clamp-2">{c.desc}</p>

				  <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
					{c.cta}
					<ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
				  </div>
				</div>
			  </Link>
			</li>
		  ))}
		</ul>

      </section>

      {/* ---------------- VALEURS (inchangé) ---------------- */}
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

      {/* ---------------- DERNIERS GUIDES ---------------- */}
      <section className="mt-14 md:mt-18 container-page">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-ink">Derniers guides</h2>
          <Link href="/pages" className="text-sm underline text-brand-600 hover:text-brand-700">
            Voir tous les guides
          </Link>
        </div>

        <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {latestGuides.map((p) => (
            <li key={p.id} className="rounded-2xl border border-ring bg-white hover:shadow-card transition">
              <Link href={`/pages/${p.slug}`} className="block">
                <div className="aspect-[16/9] w-full overflow-hidden rounded-t-2xl bg-muted">
                  {p.thumbnailUrl ? (
                    <img
                      src={p.thumbnailUrl}
                      alt={p.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-muted to-white" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-ink line-clamp-2">{p.title}</h3>
                  {p.intro ? (
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{p.intro}</p>
                  ) : null}
                  <div className="mt-2 text-xs text-slate-500">
                    Publié le {p.createdAt.toISOString().slice(0, 10)}
                  </div>
                </div>
              </Link>
            </li>
          ))}

          {latestGuides.length === 0 ? (
            <li className="sm:col-span-2 lg:col-span-3">
              <div className="card p-6 text-center">
                <h3 className="font-semibold text-ink">Aucun guide publié pour l’instant</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Publie un premier guide depuis le backoffice, il apparaîtra automatiquement ici.
                </p>
                <div className="mt-4">
                  <Link href="/pages" className="btn-outline">
                    Aller aux guides
                  </Link>
                </div>
              </div>
            </li>
          ) : null}
        </ul>
      </section>

      {/* ---------------- TOP MARQUES (inchangé, en bas) ---------------- */}
      <section className="mt-14 md:mt-18 container-page">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-ink">Top marques</h2>
          <Link href="/marques" className="text-sm underline text-brand-600 hover:text-brand-700">
            Voir tout l’annuaire
          </Link>
        </div>

        <ul className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {topBrands.map((b) => (
            <li key={b.slug} className="group">
              <Link
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
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
