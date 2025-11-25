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
          <div className="space-y-2">
            {/* Header desktop */}
            <div className="hidden md:grid md:grid-cols-[2fr,2fr,auto,auto] text-xs font-medium text-neutral-500 px-1">
              <span>Libellé</span>
              <span>Slug</span>
              <span>Ordre</span>
              <span className="text-right">Actions</span>
            </div>

            <ul className="space-y-2">
              {categories.map((cat) => (
                <li
                  key={cat.id}
                  className="rounded-xl border px-3 py-2 bg-surface/40"
                >
                  <form
                    action={updateCategory}
                    className="grid gap-2 md:grid-cols-[2fr,2fr,auto,auto] md:items-center"
                  >
                    <input type="hidden" name="id" value={cat.id} />

                    {/* Libellé */}
                    <div className="grid gap-1">
                      <label className="text-xs text-neutral-500 md:hidden">
                        Libellé
                      </label>
                      <input
                        name="label"
                        defaultValue={cat.label}
                        className="input text-sm"
                      />
                    </div>

                    {/* Slug */}
                    <div className="grid gap-1">
                      <label className="text-xs text-neutral-500 md:hidden">
                        Slug
                      </label>
                      <input
                        name="slug"
                        defaultValue={cat.slug}
                        className="input text-sm"
                      />
                    </div>

                    {/* Ordre */}
                    <div className="grid gap-1 max-w-[100px]">
                      <label className="text-xs text-neutral-500 md:hidden">
                        Ordre
                      </label>
                      <input
                        name="order"
                        type="number"
                        defaultValue={cat.order ?? 0}
                        className="input text-sm"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                      <button type="submit" className="btn btn-sm">
                        Enregistrer
                      </button>

                      <button
                        type="submit"
                        formAction={deleteCategory}
                        className="btn btn-sm btn-danger"
                      >
                        Supprimer
                      </button>
                    </div>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
