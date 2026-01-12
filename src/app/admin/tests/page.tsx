// src/app/admin/tests/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { approveTest, rejectTest, deleteTest } from "@/app/actions/tests";

export const revalidate = 0;

export default async function TestsAdminPage() {
  const [pending, approved, rejected] = await Promise.all([
    prisma.editorialTest.findMany({
      where: { status: "PENDING" },
      orderBy: { publishedAt: "desc" },
      include: {
        product: {
          select: { slug: true, brand: true, model: true, season: true },
        },
      },
      take: 50,
    }),
    prisma.editorialTest.findMany({
      where: { status: "APPROVED" },
      orderBy: { publishedAt: "desc" },
      include: {
        product: {
          select: { slug: true, brand: true, model: true, season: true },
        },
      },
      take: 50,
    }),
    prisma.editorialTest.findMany({
      where: { status: "REJECTED" },
      orderBy: { publishedAt: "desc" },
      include: {
        product: {
          select: { slug: true, brand: true, model: true, season: true },
        },
      },
      take: 50,
    }),
  ]);

  type RowTest = (typeof pending)[number];

  const Row = ({ t }: { t: RowTest }) => {
    const productLabel = t.product
      ? [t.product.brand, t.product.model, t.product.season].filter(Boolean).join(" ")
      : "—";

    return (
      <li className="rounded-xl border p-3 grid gap-2 bg-white">
        <div className="text-sm font-medium">
          {t.title}
          {typeof t.score === "number" ? (
            <span className="ml-2 text-slate-600">· note {t.score}</span>
          ) : null}
        </div>

        <div className="text-xs text-slate-500">
          Produit : {productLabel} ·{" "}
          {t.product?.slug ? (
            <Link
              className="underline"
              href={`/p/${t.product.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              voir
            </Link>
          ) : (
            "—"
          )}
          {" · "}
          {t.sourceName}
          {t.publishedAt ? ` · ${t.publishedAt.toISOString().slice(0, 10)}` : ""}
          {" · "}
          <span
            className={
              t.status === "APPROVED"
                ? "text-green-600"
                : t.status === "REJECTED"
                ? "text-red-600"
                : "text-slate-600"
            }
          >
            {t.status.toLowerCase()}
          </span>
        </div>

        {t.excerpt ? (
          <div className="text-sm text-slate-700">{t.excerpt}</div>
        ) : null}

        {t.sourceUrl ? (
          <a
            href={t.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline text-slate-600"
          >
            Lire la source
          </a>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <form action={approveTest.bind(null, t.id)}>
            <button className="btn" type="submit">
              Approuver
            </button>
          </form>
          <form action={rejectTest.bind(null, t.id)}>
            <button className="btn-secondary" type="submit">
              Rejeter
            </button>
          </form>
          <form action={deleteTest.bind(null, t.id)}>
            <button className="btn-outline" type="submit">
              Supprimer
            </button>
          </form>
        </div>
      </li>
    );
  };

  const totalCount = pending.length + approved.length + rejected.length;

  return (
    <div className="grid gap-8">
      {/* Header + CTA création */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Tests de matériel</h1>
          <p className="text-sm text-slate-600">
            Liste des tests liés aux produits. Tu peux modérer les tests existants ou en créer de nouveaux.
          </p>
        </div>

        <Link href="/admin/tests/new" className="btn">
          + Ajouter un test
        </Link>
      </header>

      {totalCount === 0 && (
        <section className="rounded-xl border border-dashed p-4 bg-surface/50">
          <p className="text-sm text-slate-600">
            Aucun test n’a encore été créé. Utilise le bouton « Ajouter un test » pour créer le premier test
            et le lier à un produit existant.
          </p>
        </section>
      )}

      {/* En attente */}
      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">En attente ({pending.length})</h2>
          <ul className="mt-3 grid gap-3">
            {pending.map((t) => (
              <Row key={t.id} t={t} />
            ))}
          </ul>
        </section>
      )}

      {/* Approuvés */}
      {approved.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Approuvés ({approved.length})</h2>
          <ul className="mt-3 grid gap-3">
            {approved.map((t) => (
              <Row key={t.id} t={t} />
            ))}
          </ul>
        </section>
      )}

      {/* Rejetés */}
      {rejected.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Rejetés ({rejected.length})</h2>
          <ul className="mt-3 grid gap-3">
            {rejected.map((t) => (
              <Row key={t.id} t={t} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
