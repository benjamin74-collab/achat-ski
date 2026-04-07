// src/app/admin/guide-categories/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteGuideCategoryButton from "./partials/DeleteGuideCategoryButton";

export default async function AdminGuideCategoriesPage() {
  const rows = await prisma.guideCategory.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      order: true,
      isInMenu: true,
      active: true,
      _count: {
        select: {
          pages: true,
        },
      },
    },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Catégories de guides</h1>
        <Link
          href="/admin/guide-categories/new"
          className="px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600"
        >
          ➕ Nouvelle catégorie
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">
        {rows.length} catégorie{rows.length > 1 ? "s" : ""}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse border border-ring rounded-lg overflow-hidden">
          <thead className="bg-muted/60">
            <tr>
              <th className="border border-ring px-3 py-2 text-left">Nom</th>
              <th className="border border-ring px-3 py-2 text-left">Slug</th>
              <th className="border border-ring px-3 py-2 text-right">Ordre</th>
              <th className="border border-ring px-3 py-2 text-center">Menu</th>
              <th className="border border-ring px-3 py-2 text-center">Active</th>
              <th className="border border-ring px-3 py-2 text-right">Pages liées</th>
              <th className="border border-ring px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-accent/30">
                <td className="border border-ring px-3 py-2">{c.name}</td>
                <td className="border border-ring px-3 py-2 text-slate-500">{c.slug}</td>
                <td className="border border-ring px-3 py-2 text-right">{c.order}</td>
                <td className="border border-ring px-3 py-2 text-center">{c.isInMenu ? "✅" : "❌"}</td>
                <td className="border border-ring px-3 py-2 text-center">{c.active ? "✅" : "❌"}</td>
                <td className="border border-ring px-3 py-2 text-right">{c._count.pages}</td>
                <td className="border border-ring px-3 py-2">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/guide-categories/${c.id}/edit`} className="underline">
                      Modifier
                    </Link>

                    <DeleteGuideCategoryButton
                      id={c.id}
                      name={c.name}
                      linkedPagesCount={c._count.pages}
                    />
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