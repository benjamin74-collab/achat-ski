import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 60;

export default async function AdminCookiesPage() {
  const items = await prisma.cookieDefinition.findMany({
    orderBy: [{ mandatory: "desc" }, { purpose: "asc" }, { name: "asc" }],
  });

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ href: "/admin", label: "Admin" }, { label: "Cookies" }]} />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Cookies</h1>
        <Link href="/admin/cookies/new" className="btn">+ Nouveau cookie</Link>
      </div>

      <div className="rounded-2xl border bg-surface/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="p-3 text-left">Nom</th>
              <th className="p-3 text-left">Clé</th>
              <th className="p-3 text-left">Finalité</th>
              <th className="p-3 text-center">Obligatoire</th>
              <th className="p-3 text-center">Site</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.name}</td>
                <td className="p-3 text-neutral-600">{c.key}</td>
                <td className="p-3">{c.purpose}</td>
                <td className="p-3 text-center">{c.mandatory ? "✅" : "❌"}</td>
                <td className="p-3 text-center">{c.siteId ?? "Tous"}</td>
                <td className="p-3 text-right">
                  <Link className="btn btn-sm" href={`/admin/cookies/${c.id}/edit`}>Modifier</Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-neutral-500">Aucun cookie défini</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}