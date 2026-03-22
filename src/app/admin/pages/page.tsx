// src/app/admin/pages/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function AdminPages() {
  async function deletePageAction(id: number, slug: string) {
    "use server";

    await prisma.page.delete({
      where: { id },
    });

    revalidatePath("/admin/pages");
    revalidatePath("/pages");
    revalidatePath(`/pages/${slug}`);
  }

  const rows = await prisma.page.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      published: true,
      createdAt: true,
      thumbnailUrl: true,
      thumbnail: { select: { publicUrl: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pages</h1>
        <Link href="/admin/pages/new" className="btn">
          + Nouvelle page
        </Link>
      </div>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-2">Miniature</th>
            <th className="py-2">Titre</th>
            <th className="py-2">Slug</th>
            <th className="py-2">Statut</th>
            <th className="py-2">Créée le</th>
            <th className="py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const thumb = r.thumbnail?.publicUrl ?? r.thumbnailUrl ?? null;

            return (
              <tr key={r.id} className="border-t">
                <td className="py-2">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      width={64}
                      height={36}
                      className="rounded border object-cover aspect-video"
                    />
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                <td className="py-2">{r.title}</td>
                <td className="py-2 text-slate-600">{r.slug}</td>
                <td className="py-2">{r.published ? "Publié" : "Brouillon"}</td>
                <td className="py-2">{r.createdAt.toISOString().slice(0, 10)}</td>

                <td className="py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/pages/${r.id}/edit`} className="underline">
                      Éditer
                    </Link>

                    <form
                      action={async () => {
                        "use server";
                        await deletePageAction(r.id, r.slug);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-red-600 underline hover:text-red-700"
                        onClick={(e) => {
                          if (!confirm(`Supprimer la page "${r.title}" ?`)) {
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}