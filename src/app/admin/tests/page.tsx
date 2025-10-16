// src/app/admin/tests/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { approveTest, rejectTest } from "@/app/actions/tests";

export const dynamic = "force-dynamic";

type SessionUser = { role?: "ADMIN" | "USER" } | undefined;

export default async function AdminTestsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as SessionUser)?.role ?? "USER";
  if (!session || role !== "ADMIN") return notFound();

  const tests = await prisma.editorialTest.findMany({
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      excerpt: true,
      score: true,
      sourceName: true,
      sourceUrl: true,
      status: true,
      publishedAt: true,
      product: { select: { brand: true, model: true, season: true, slug: true } },
    },
  });

  return (
    <main className="py-6">
      <h1 className="text-2xl font-semibold">Tests & Essais</h1>

      <section className="mt-6">
        <ul className="space-y-3">
          {tests.map((t) => {
            const productLabel = [t.product.brand, t.product.model, t.product.season]
              .filter(Boolean)
              .join(" ");
            return (
              <li key={t.id} className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-slate-600">
                      {productLabel} · {t.sourceName} · {t.publishedAt.toISOString().slice(0, 10)}
                      {typeof t.score === "number" ? ` · note ${t.score}` : ""}
                      {" · "}
                      <span className={t.status === "APPROVED" ? "text-green-600" : t.status === "REJECTED" ? "text-red-600" : "text-slate-600"}>
                        {t.status.toLowerCase()}
                      </span>
                    </div>
                    {t.excerpt ? <p className="mt-1 text-sm text-slate-700">{t.excerpt}</p> : null}
                    {t.sourceUrl ? (
                      <a
                        href={t.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs underline text-slate-600"
                      >
                        Lire la source
                      </a>
                    ) : null}
                  </div>

                  {/* ❗️Pas de action={...}. On utilise des buttons avec formAction typée */}
                  <div className="flex items-center gap-2">
                    <form>
                      <input type="hidden" name="id" value={t.id} />
                      <button
                        className="text-xs px-3 py-1.5 rounded-lg border border-ring hover:bg-green-50 text-green-700"
                        formAction={async (fd: FormData) => {
                          const idRaw = fd.get("id");
                          const id = typeof idRaw === "string" ? Number(idRaw) : Number(idRaw);
                          if (Number.isFinite(id)) {
                            await approveTest(id);
                          }
                        }}
                      >
                        Valider
                      </button>
                    </form>

                    <form>
                      <input type="hidden" name="id" value={t.id} />
                      <button
                        className="text-xs px-3 py-1.5 rounded-lg border border-ring hover:bg-red-50 text-red-600"
                        formAction={async (fd: FormData) => {
                          const idRaw = fd.get("id");
                          const id = typeof idRaw === "string" ? Number(idRaw) : Number(idRaw);
                          if (Number.isFinite(id)) {
                            await rejectTest(id);
                          }
                        }}
                      >
                        Rejeter
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
