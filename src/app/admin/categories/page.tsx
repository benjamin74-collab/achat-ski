import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function AdminCategoriesPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  // 🔒 Protection : admin uniquement
  if (!session || role !== "ADMIN") return notFound();

  // ✅ On utilise bien le nouveau modèle Category
  const cats = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      isNav: true,
      published: true,
      sortOrder: true,
    },
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Gestion des catégories</h1>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {cats.length} catégorie{cats.length > 1 ? "s" : ""}
        </p>
        <Link
          href="/admin/categories/new"
          className="px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600"
        >
          ➕ Nouvelle catégorie
        </Link>
      </div>

      <table className="w-full text-sm border-collapse border border-ring">
        <thead className="bg-muted">
          <tr>
            <th className="border border-ring px-3 py-2 text-left">Nom</th>
            <th className="border border-ring px-3 py-2 text-left">Slug</th>
            <th className="border border-ring px-3 py-2 text-left">Parent</th>
            <th className="border border-ring px-3 py-2 text-center">Menu</th>
            <th className="border border-ring px-3 py-2 text-center">Publié</th>
            <th className="border border-ring px-3 py-2 text-right">Ordre</th>
          </tr>
        </thead>
        <tbody>
          {cats.map((c) => (
            <tr key={c.id}>
              <td className="border border-ring px-3 py-2">{c.name}</td>
              <td className="border border-ring px-3 py-2 text-slate-500">
                {c.slug}
              </td>
              <td className="border border-ring px-3 py-2 text-slate-500">
                {c.parentId ?? "—"}
              </td>
              <td className="border border-ring px-3 py-2 text-center">
                {c.isNav ? "✅" : "❌"}
              </td>
              <td className="border border-ring px-3 py-2 text-center">
                {c.published ? "✅" : "❌"}
              </td>
              <td className="border border-ring px-3 py-2 text-right">
                {c.sortOrder}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
