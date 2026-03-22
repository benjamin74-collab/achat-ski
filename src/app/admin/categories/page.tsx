// src/app/admin/categories/page.tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { deleteCategory } from "@/app/actions/categories";

export default async function AdminCategoriesPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session || role !== "ADMIN") return notFound();

  const cats = await prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      isInMenu: true,
      published: true,
      order: true,
      parent: { select: { name: true } },
    },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gestion des catégories</h1>
        <Link
          href="/admin/categories/new"
          className="px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600"
        >
          ➕ Nouvelle catégorie
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">
        {cats.length} catégorie{cats.length > 1 ? "s" : ""}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse border border-ring rounded-lg overflow-hidden">
          <thead className="bg-muted/60">
            <tr>
              <th className="border border-ring px-3 py-2 text-left">Nom</th>
              <th className="border border-ring px-3 py-2 text-left">Slug</th>
              <th className="border border-ring px-3 py-2 text-left">Parent</th>
              <th className="border border-ring px-3 py-2 text-center">Menu</th>
              <th className="border border-ring px-3 py-2 text-center">Publié</th>
              <th className="border border-ring px-3 py-2 text-right">Ordre</th>
              <th className="border border-ring px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} className="hover:bg-accent/30">
                <td className="border border-ring px-3 py-2">{c.name}</td>
                <td className="border border-ring px-3 py-2 text-slate-500">{c.slug}</td>
                <td className="border border-ring px-3 py-2 text-slate-500">
                  {c.parent?.name ?? "—"}
                </td>
                <td className="border border-ring px-3 py-2 text-center">
                  {c.isInMenu ? "✅" : "❌"}
                </td>
                <td className="border border-ring px-3 py-2 text-center">
                  {c.published ? "✅" : "❌"}
                </td>
                <td className="border border-ring px-3 py-2 text-right">{c.order}</td>
                <td className="border border-ring px-3 py-2">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/categories/${c.slug}`} className="underline">
                      Modifier
                    </Link>

                    <form
                      action={async () => {
                        "use server";
                        await deleteCategory(c.slug);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-red-600 underline hover:text-red-700"
                        onClick={(e) => {
                          if (!confirm(`Supprimer la catégorie "${c.name}" ?`)) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}