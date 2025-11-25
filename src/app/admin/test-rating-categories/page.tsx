// src/app/admin/test-rating-categories/page.tsx
import { prisma } from "@/lib/prisma";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "./actions";

export const revalidate = 0;

export default async function TestRatingCategoriesAdminPage() {
  const categories = await prisma.testRatingCategory.findMany({
    orderBy: [{ order: "asc" }, { label: "asc" }],
  });

  return (
    <div className="grid gap-8">
      {/* Intro */}
      <section className="rounded-xl border border-dashed p-4 bg-surface/50">
        <h1 className="text-lg font-semibold mb-1">
          Catégories de notation des tests
        </h1>
        <p className="text-sm text-slate-600">
          Ces catégories (ex: Design, Prix, Confort…) servent à noter les
          produits dans les tests. Elles sont utilisées dans le backoffice de
          création de test et s’affichent ensuite sur la fiche produit.
        </p>
      </section>

      {/* Création d'une nouvelle catégorie */}
      <section className="rounded-xl border bg-surface/70 p-4">
        <h2 className="text-base font-semibold mb-3">
          Nouvelle catégorie
        </h2>
        <form action={createCategory} className="grid gap-3 max-w-xl">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Libellé *</label>
            <input
              name="label"
              required
              className="input"
              placeholder="Ex: Design, Prix, Confort…"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">
              Slug (optionnel)
            </label>
            <input
              name="slug"
              className="input"
              placeholder="design, prix, confort…"
            />
            <p className="text-xs text-neutral-500">
              Laisser vide pour générer automatiquement à partir du libellé.
            </p>
          </div>

          <div className="grid gap-1 max-w-xs">
            <label className="text-sm font-medium">Ordre</label>
            <input
              name="order"
              type="number"
              className="input"
              defaultValue={0}
            />
            <p className="text-xs text-neutral-500">
              Sert à trier les catégories (plus petit = plus haut).
            </p>
          </div>

          <div>
            <button type="submit" className="btn">
              Ajouter la catégorie
            </button>
          </div>
        </form>
      </section>

      {/* Liste / édition des catégories existantes */}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-base font-semibold mb-3">
          Catégories existantes ({categories.length})
        </h2>

        {categories.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucune catégorie pour l’instant.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-2 text-left">Libellé</th>
                  <th className="p-2 text-left">Slug</th>
                  <th className="p-2 text-left w-24">Ordre</th>
                  <th className="p-2 text-right w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-t">
                    <td className="p-2 align-middle">
                      <form
                        action={updateCategory}
                        className="flex flex-col gap-1 sm:flex-row sm:items-center"
                      >
                        <input type="hidden" name="id" value={cat.id} />
                        <input
                          name="label"
                          defaultValue={cat.label}
                          className="input text-sm"
                        />
                    </td>
                    <td className="p-2 align-middle">
                        <input
                          name="slug"
                          defaultValue={cat.slug}
                          className="input text-sm"
                        />
                    </td>
                    <td className="p-2 align-middle">
                        <input
                          name="order"
                          type="number"
                          defaultValue={cat.order ?? 0}
                          className="input text-sm w-20"
                        />
                    </td>
                    <td className="p-2 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="submit"
                          className="btn btn-sm"
                        >
                          Enregistrer
                        </button>
                      </div>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Suppression: formulaire séparé par ligne */}
            <div className="mt-2 text-xs text-neutral-500">
              Pour supprimer une catégorie, utilise le bouton dédié dans une
              prochaine itération si besoin (on peut ajouter une colonne
              “Supprimer” avec confirmation).
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
// src/app/admin/test-rating-categories/page.tsx
import { prisma } from "@/lib/prisma";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "./actions";

export const revalidate = 0;

export default async function TestRatingCategoriesAdminPage() {
  const categories = await prisma.testRatingCategory.findMany({
    orderBy: [{ order: "asc" }, { label: "asc" }],
  });

  return (
    <div className="grid gap-8">
      {/* Intro */}
      <section className="rounded-xl border border-dashed p-4 bg-surface/50">
        <h1 className="text-lg font-semibold mb-1">
          Catégories de notation des tests
        </h1>
        <p className="text-sm text-slate-600">
          Ces catégories (ex: Design, Prix, Confort…) servent à noter les
          produits dans les tests. Elles sont utilisées dans le backoffice de
          création de test et s’affichent ensuite sur la fiche produit.
        </p>
      </section>

      {/* Création d'une nouvelle catégorie */}
      <section className="rounded-xl border bg-surface/70 p-4">
        <h2 className="text-base font-semibold mb-3">
          Nouvelle catégorie
        </h2>
        <form action={createCategory} className="grid gap-3 max-w-xl">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Libellé *</label>
            <input
              name="label"
              required
              className="input"
              placeholder="Ex: Design, Prix, Confort…"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">
              Slug (optionnel)
            </label>
            <input
              name="slug"
              className="input"
              placeholder="design, prix, confort…"
            />
            <p className="text-xs text-neutral-500">
              Laisser vide pour générer automatiquement à partir du libellé.
            </p>
          </div>

          <div className="grid gap-1 max-w-xs">
            <label className="text-sm font-medium">Ordre</label>
            <input
              name="order"
              type="number"
              className="input"
              defaultValue={0}
            />
            <p className="text-xs text-neutral-500">
              Sert à trier les catégories (plus petit = plus haut).
            </p>
          </div>

          <div>
            <button type="submit" className="btn">
              Ajouter la catégorie
            </button>
          </div>
        </form>
      </section>

      {/* Liste / édition des catégories existantes */}
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-base font-semibold mb-3">
          Catégories existantes ({categories.length})
        </h2>

        {categories.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucune catégorie pour l’instant.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-2 text-left">Libellé</th>
                  <th className="p-2 text-left">Slug</th>
                  <th className="p-2 text-left w-24">Ordre</th>
                  <th className="p-2 text-right w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-t">
                    <td className="p-2 align-middle">
                      <form
                        action={updateCategory}
                        className="flex flex-col gap-1 sm:flex-row sm:items-center"
                      >
                        <input type="hidden" name="id" value={cat.id} />
                        <input
                          name="label"
                          defaultValue={cat.label}
                          className="input text-sm"
                        />
                    </td>
                    <td className="p-2 align-middle">
                        <input
                          name="slug"
                          defaultValue={cat.slug}
                          className="input text-sm"
                        />
                    </td>
                    <td className="p-2 align-middle">
                        <input
                          name="order"
                          type="number"
                          defaultValue={cat.order ?? 0}
                          className="input text-sm w-20"
                        />
                    </td>
                    <td className="p-2 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="submit"
                          className="btn btn-sm"
                        >
                          Enregistrer
                        </button>
                      </div>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Suppression: formulaire séparé par ligne */}
            <div className="mt-2 text-xs text-neutral-500">
              Pour supprimer une catégorie, utilise le bouton dédié dans une
              prochaine itération si besoin (on peut ajouter une colonne
              “Supprimer” avec confirmation).
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
