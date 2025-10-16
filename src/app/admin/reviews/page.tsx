import { prisma } from "@/lib/prisma";
import { approveReview, rejectReview, deleteReview } from "@/app/actions/reviews";
import NewReviewForm from "./partials/NewReviewForm";

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
    <li className="rounded-xl border p-3 grid gap-2">
      <div className="text-sm font-medium">
        {r.title} — <span className="text-slate-600">{r.rating}/5</span>
      </div>
      <div className="text-xs text-slate-500">
        Produit : {r.product ? `${r.product.brand} ${r.product.model} ${r.product.season ?? ""}`.trim() : "—"} ·{" "}
        <a className="underline" href={`/p/${r.product?.slug}`} target="_blank">voir</a>
      </div>
      {r.body ? <div className="text-sm text-slate-700">{r.body}</div> : null}
      <div className="flex gap-2">
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
      <section>
        <h2 className="text-lg font-semibold">Ajouter un avis</h2>
        <div className="mt-3 rounded-2xl border p-4 bg-white">
          <NewReviewForm />
        </div>
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
