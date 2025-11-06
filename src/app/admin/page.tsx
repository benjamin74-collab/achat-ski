// src/app/admin/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return notFound();

  const [reviewsPending, testsPending, categoriesCount, brandsCount, pagesCount] = await Promise.all([
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.editorialTest.count({ where: { status: "PENDING" } }),
    prisma.category.count(),
    prisma.brand.count(),
    prisma.page.count(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>

      {/* md: 3 colonnes ; lg: 5 colonnes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Avis en attente</div>
          <div className="mt-1 text-3xl font-bold">{reviewsPending}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Tests en attente</div>
          <div className="mt-1 text-3xl font-bold">{testsPending}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Catégories</div>
          <div className="mt-1 text-3xl font-bold">{categoriesCount}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Marques</div>
          <div className="mt-1 text-3xl font-bold">{brandsCount}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-neutral-500">Pages</div>
          <div className="mt-1 text-3xl font-bold">{pagesCount}</div>
        </div>
      </div>
    </div>
  );
}
