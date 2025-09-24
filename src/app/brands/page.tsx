// src/app/brands/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const revalidate = 300;

export default async function BrandsIndex() {
  // Regroupement par marque, sans orderBy ni filtres non supportés
  const rows = await prisma.product.groupBy({
    by: ["brand"],
    _count: { _all: true },
  });

  // Filtre + tri côté JS pour éviter les soucis de types Prisma
  const brands = rows
    .map((r) => ({
      name: (r.brand ?? "").trim(),
      count: r._count._all,
    }))
    .filter((b) => b.name !== "")
    .sort((a, b) => b.count - a.count);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Marques</h1>

      {brands.length === 0 ? (
        <p className="mt-4 text-neutral-600">Aucune marque pour le moment.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => (
            <li key={b.name} className="rounded-xl border p-4 flex items-center justify-between">
              <Link href={`/b/${encodeURIComponent(b.name)}`} className="hover:underline">
                {b.name}
              </Link>
              <span className="text-sm text-neutral-500">{b.count}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
