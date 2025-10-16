// src/app/admin/tests/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NewTestForm from "./partials/NewTestForm";
import { approveTest, rejectTest, deleteTest } from "@/app/actions/tests";

export const dynamic = "force-dynamic";

export default async function AdminTestsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role ?? "USER";
  if (!session || role !== "ADMIN") return notFound();

  const tests = await prisma.editorialTest.findMany({
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      status: true,
      score: true,
      sourceName: true,
      sourceUrl: true,
      publishedAt: true,
      product: {
        select: { id: true, slug: true, brand: true, model: true, season: true },
      },
    },
  });

  return (
    <main className="py-6">
      <h1 className="text-2xl font-semibold">Tests</h1>

      <section className="mt-6 card p-4">
        <h2 className="font-semibold">Nouveau test</h2>
        <div className="mt-4">
          <NewTestForm />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold mb-3">Derniers tests</h2>
        <ul className="space-y-3">
          {tests.map((t) => (
            <li key={t.id} className="rounded-xl border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-slate-600">
                    {t.product ? (
                      <>
                        Produit : <a className="underline" href={`/p/${t.product.slug}`}>
                          {[t.product.brand, t.product.model, t.product.season]
                            .filter(Boolean)
                            .join(" ")}
                        </a>
                      </>
                    ) : (
                      "—"
                    )}
                    {" · "}Source : {t.sourceName}
                    {" · "}Score : {t.score ?? "—"}
                    {" · "}Statut : <b>{t.status}</b>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <form action={approveTest}>
                    <input type="hidden" name="id" value={t.id} />
                    <button
                      formAction={async (formData) => {
                        const id = Number(formData.get("id"));
                        await approveTest(id);
                      }}
                      className="btn-accent text-xs px-3 py-1.5"
                    >
                      Approuver
                    </button>
                  </form>
                  <form action={rejectTest}>
                    <input type="hidden" name="id" value={t.id} />
                    <button
                      formAction={async (formData) => {
                        const id = Number(formData.get("id"));
                        await rejectTest(id);
                      }}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      Rejeter
                    </button>
                  </form>
                  <form action={deleteTest}>
                    <input type="hidden" name="id" value={t.id} />
                    <button
                      formAction={async (formData) => {
                        const id = Number(formData.get("id"));
                        await deleteTest(id);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-ring hover:bg-red-50 text-red-600"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
