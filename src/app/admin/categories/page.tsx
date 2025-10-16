// src/app/admin/categories/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NewCategoryForm from "./partials/NewCategoryForm";
import { deleteCategory } from "@/app/actions/categories";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role ?? "USER";
  if (!session || role !== "ADMIN") return notFound();

  const cats = await prisma.categoryPage.findMany({
    orderBy: { slug: "asc" },
    select: {
      slug: true, name: true, published: true, metaTitle: true, metaDescription: true, updatedAt: true,
    },
  });

  return (
    <main className="py-6">
      <h1 className="text-2xl font-semibold">Catégories</h1>

      <section className="mt-6 card p-4">
        <h2 className="font-semibold">Créer / Mettre à jour</h2>
        <div className="mt-4">
          <NewCategoryForm />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-semibold mb-3">Liste</h2>
        <ul className="space-y-3">
          {cats.map((c) => (
            <li key={c.slug} className="rounded-xl border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{c.name} <span className="text-slate-500">/c/{c.slug}</span></div>
                  <div className="text-xs text-slate-600">
                    {c.published ? "publiée" : "non publiée"} · MAJ {c.updatedAt.toISOString().slice(0,10)}
                    {c.metaTitle ? <> · meta title: <i>{c.metaTitle}</i></> : null}
                  </div>
                </div>
                <form action={deleteCategory}>
                  <input type="hidden" name="slug" value={c.slug} />
                  <button
                    formAction={async (fd) => {
                      const slug = String(fd.get("slug") ?? "");
                      await deleteCategory(slug);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-ring hover:bg-red-50 text-red-600"
                  >
                    Supprimer
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
