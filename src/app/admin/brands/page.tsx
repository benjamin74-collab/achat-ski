import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";
import { deleteBrand } from "./actions";
import { toggleBrandHomepage } from "@/app/actions/brands";

export const revalidate = 60;

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, active: true, websiteUrl: true, logoUrl: true, showOnHomepage: true },
  });

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ href: "/admin", label: "Admin" }, { label: "Marques" }]} />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Marques</h1>
        <Link href="/admin/brands/new" className="btn">
          + Nouvelle marque
        </Link>
      </div>

      <div className="rounded-2xl border bg-surface/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="p-3 text-left">Nom</th>
              <th className="p-3">Actif</th>
              <th className="p-3">Site</th>
              <th className="p-3">Slug</th>
			  <th className="p-3">Homepage</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-3 flex items-center gap-2">
                  {b.logoUrl ? <img src={b.logoUrl} alt="" width={24} height={24} /> : null}
                  <span>{b.name}</span>
                </td>
                <td className="p-3 text-center">{b.active ? "✅" : "❌"}</td>
                <td className="p-3 text-center">
                  {b.websiteUrl ? (
                    <a href={b.websiteUrl} target="_blank" rel="noreferrer">
                      Ouvrir
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-3 text-center">{b.slug}</td>
				<td className="p-3 text-center">
				  <form
					action={async () => {
					  "use server";
					  await toggleBrandHomepage(b.id, !b.showOnHomepage);
					}}
				  >
					<button
					  type="submit"
					  className="rounded-full px-2 py-1 hover:bg-muted"
					  title={b.showOnHomepage ? "Retirer de la homepage" : "Afficher en homepage"}
					>
					  {b.showOnHomepage ? "✅" : "❌"}
					</button>
				  </form>
				</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link className="btn btn-sm" href={`/admin/brands/${b.id}/edit`}>
                      Modifier
                    </Link>

                    <form
                      action={async () => {
                        "use server";
                        await deleteBrand(b.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-red-600 underline hover:text-red-700"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {brands.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-neutral-500">
                  Aucune marque
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}