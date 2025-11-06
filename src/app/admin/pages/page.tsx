// src/app/admin/pages/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminPages() {
  const rows = await prisma.page.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, title: true, published: true, createdAt: true }
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pages</h1>
        <Link href="/admin/pages/new" className="btn">+ Nouvelle page</Link>
      </div>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-2">Titre</th>
            <th className="py-2">Slug</th>
            <th className="py-2">Statut</th>
            <th className="py-2">Créée le</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-t">
              <td className="py-2">{r.title}</td>
              <td className="py-2 text-slate-600">{r.slug}</td>
              <td className="py-2">{r.published ? "Publié" : "Brouillon"}</td>
              <td className="py-2">{r.createdAt.toISOString().slice(0,10)}</td>
              <td className="py-2 text-right">
                <Link href={`/admin/pages/${r.id}/edit`} className="underline">Éditer</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
