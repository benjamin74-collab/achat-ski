// src/app/admin/reviews/page.tsx
import { prisma } from "@/lib/prisma";
import { approveReview, rejectReview, deleteReview } from "@/app/actions/reviews";

export const revalidate = 0;

export default async function ReviewsAdminPage() {
  const [pending, approved, rejected] = await Promise.all([
    prisma.review.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { product: { select: { slug: true, brand: true, model: true, season: true } } },
      take: 50,
    }),
    prisma.review.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      include: { product: { select: { slug: true, brand: true, model: true, season: true } } },
      take: 50,
    }),
    prisma.review.findMany({
      where: { status: "REJECTED" },
      orderBy: { createdAt: "desc" },
      include: { product: { select: { slug: true, brand: true, model: true, season: true } } },
      take: 50,
    }),
  ]);

  const Row = ({ r }: { r: typeof pending[number] }) => (
    <li className="rounded-xl border p-3 grid gap-2 bg-white">
      <div className="text-sm font-medium">
        {r.title} — <span className="text-slate-600">{r.rating}/5</span>
      </div>
      <div className="text-xs text-slate-500">
        Produit : {r.product ? `${r.product.brand} ${r.product.model} ${r.product.season ?? ""}`.trim() : "—"} ·{" "}
        {r.product?.slug ? (
          <a className="underline" href={`/p/${r.product.slug}`} target="_blank" rel="noreferrer">
            voir
          </a>
        ) : (
          "—"
        )}
      </div>
      {r.body ? <div className="text-sm text-slate-700">{r.body}</div> : null}
      <div className="flex flex-wrap gap-2">
        <form action={approveReview.bind(null, r.id)}>
          <button className="btn" type="submit">Approuver</button>
        </form>
        <form action={rejectReview.bind(null, r.id)}>
          <button className="btn-secondary" type="submit">Rejeter</button>
        </form>
        <form action={deleteReview.bind(null, r.id)}>
          <button className="btn-outline" type="submit">Supprimer</button>
        </form>
      </div>
    </li>
  );

  return (
    <div className="grid gap-8">
      {/* Note d’UX : on indique où créer un avis (depuis la fiche produit) */}
      <section className="rounded-xl border border-dashed p-4 bg-surface/50">
        <p className="text-sm text-slate-600">
          La création d’avis se fait désormais depuis chaque fiche produit (liens « Je souhaite donner un avis »). 
          Cette page sert uniquement à la modération et à la gestion.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">En attente ({pending.length})</h2>
        <ul className="mt-3 grid gap-3">
          {pending.map((r) => <Row key={r.id} r={r} />)}
          {pending.length === 0 && <p className="text-sm text-slate-500">Aucun avis en attente.</p>}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Approuvés ({approved.length})</h2>
        <ul className="mt-3 grid gap-3">
          {approved.map((r) => <Row key={r.id} r={r} />)}
          {approved.length === 0 && <p className="text-sm text-slate-500">Aucun avis approuvé.</p>}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Rejetés ({rejected.length})</h2>
        <ul className="mt-3 grid gap-3">
          {rejected.map((r) => <Row key={r.id} r={r} />)}
          {rejected.length === 0 && <p className="text-sm text-slate-500">Aucun avis rejeté.</p>}
        </ul>
      </section>
    </div>
  );
}
