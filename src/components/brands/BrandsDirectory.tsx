"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Brand = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  metaDescription: string | null;
  showOnHomepage: boolean;
  _count: {
    products: number;
  };
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function BrandsDirectory({ brands }: { brands: Brand[] }) {
  const [query, setQuery] = useState("");

  const filteredBrands = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return brands;

    return brands.filter((brand) =>
      brand.name.toLowerCase().includes(q)
    );
  }, [brands, query]);

  const groupedBrands = useMemo(() => {
    return filteredBrands.reduce<Record<string, Brand[]>>((acc, brand) => {
      const firstLetter = brand.name.charAt(0).toUpperCase();
      const key = /^[A-Z]$/.test(firstLetter) ? firstLetter : "#";

      if (!acc[key]) acc[key] = [];
      acc[key].push(brand);

      return acc;
    }, {});
  }, [filteredBrands]);

  const availableLetters = Object.keys(groupedBrands).sort();

  const featuredBrands = brands.filter((brand) => brand.showOnHomepage);

  return (
    <>
      <header className="mt-6 rounded-3xl border border-ring bg-surface p-6 shadow-card md:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Marques ski & outdoor
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
          Toutes les marques de ski, montagne et outdoor
        </h1>

        <p className="mt-5 max-w-3xl text-base leading-8 text-neutral-600 md:text-lg">
          Retrouvez les principales marques de skis, chaussures, fixations,
          textile technique, sécurité avalanche, ski de randonnée, freeride et
          équipement outdoor référencées sur Meilleur-Ski.
        </p>

        <div className="mt-8 max-w-2xl">
          <label htmlFor="brand-search" className="sr-only">
            Rechercher une marque
          </label>

          <input
            id="brand-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une marque : Rossignol, Salomon, Patagonia..."
            className="w-full rounded-2xl border border-ring bg-white px-5 py-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <p className="mt-4 text-sm text-neutral-500">
          {filteredBrands.length} marque
          {filteredBrands.length > 1 ? "s" : ""} affichée
          {filteredBrands.length > 1 ? "s" : ""}.
        </p>
      </header>

      <nav className="sticky top-0 z-20 mt-6 rounded-2xl border border-ring bg-white/90 p-3 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto">
          {ALPHABET.map((letter) => {
            const disabled = !availableLetters.includes(letter);

            return (
              <a
                key={letter}
                href={disabled ? undefined : `#letter-${letter}`}
                className={
                  disabled
                    ? "flex h-9 min-w-9 items-center justify-center rounded-lg text-sm font-semibold text-neutral-300"
                    : "flex h-9 min-w-9 items-center justify-center rounded-lg bg-neutral-100 text-sm font-semibold text-neutral-800 transition hover:bg-blue-600 hover:text-white"
                }
              >
                {letter}
              </a>
            );
          })}
        </div>
      </nav>

      {featuredBrands.length > 0 && !query && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold">Marques populaires</h2>
          <p className="mt-2 text-neutral-600">
            Les marques les plus recherchées par les skieurs.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {featuredBrands.map((brand) => (
              <BrandCard key={brand.id} brand={brand} featured />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        {availableLetters.length === 0 ? (
          <div className="rounded-3xl border border-ring bg-white p-10 text-center">
            <p className="text-lg font-semibold">Aucune marque trouvée.</p>
            <p className="mt-2 text-neutral-600">
              Essayez avec une autre recherche.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {availableLetters.map((letter) => (
              <section
                key={letter}
                id={`letter-${letter}`}
                className="scroll-mt-28"
              >
                <div className="mb-5 flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">
                    {letter}
                  </span>
                  <div className="h-px flex-1 bg-neutral-200" />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groupedBrands[letter].map((brand) => (
                    <BrandCard key={brand.id} brand={brand} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <section className="mt-16 rounded-3xl border border-ring bg-surface p-6 shadow-card md:p-8">
        <h2 className="text-2xl font-bold">
          Les principales marques de ski et outdoor
        </h2>

        <div className="mt-5 space-y-4 text-neutral-700">
          <p>
            Cette page rassemble les marques de ski, de montagne et
            d’équipement outdoor présentes sur Meilleur-Ski. Elle permet de
            retrouver rapidement une marque de skis alpins, freeride, randonnée,
            chaussures, fixations, textile technique ou sécurité avalanche.
          </p>

          <p>
            Chaque fiche marque présente l’histoire de la marque, ses gammes,
            ses technologies, ses produits phares et des conseils pour choisir
            le matériel le plus adapté à votre pratique.
          </p>
        </div>
      </section>
    </>
  );
}

function BrandCard({
  brand,
  featured = false,
}: {
  brand: Brand;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/marques/${brand.slug}`}
      className={`group rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        featured ? "border-blue-200" : "border-ring"
      }`}
    >
      <div className="flex h-20 items-center justify-center rounded-2xl bg-neutral-50 p-4">
        {brand.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logoUrl}
            alt={`Logo ${brand.name}`}
            className="max-h-12 max-w-full object-contain"
          />
        ) : (
          <span className="text-center text-lg font-bold text-neutral-900">
            {brand.name}
          </span>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-bold group-hover:text-blue-600">
          {brand.name}
        </h3>

        {brand.metaDescription && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-600">
            {brand.metaDescription}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-blue-600">Voir la marque →</span>

          {brand._count.products > 0 && (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-500">
              {brand._count.products}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}