// src/app/me/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function MePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin?callbackUrl=/me");

  const userId = session.user.id;

  const [reviews, tests] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, rating: true, productId: true, createdAt: true },
    }),
    prisma.editorialTest.findMany({
      where: { userId },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, productId: true, publishedAt: true, status: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-semibold">Mon espace</h1>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold">Mes avis</h2>
        {reviews.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">Aucun avis pour le moment.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{r.title || "Avis"}</div>
                  <div className="text-xs text-neutral-500">
                    Note {r.rating} · {r.createdAt.toISOString().slice(0, 10)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold">Mes tests</h2>
        {tests.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">Aucun test pour le moment.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {tests.map((t) => (
              <li key={t.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-neutral-500">
                    {t.status} · {t.publishedAt.toISOString().slice(0, 10)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
