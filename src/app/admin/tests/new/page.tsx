// src/app/admin/tests/new/page.tsx
import { prisma } from "@/lib/prisma";
import NewTestForm from "../partials/NewTestForm";

export const revalidate = 0;

export default async function NewTestAdminPage() {
  const categories = await prisma.testRatingCategory.findMany({
    orderBy: [{ order: "asc" }, { label: "asc" }],
  });

  return (
    <div className="grid gap-8">
      {/* Header + retour */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Créer un nouveau test</h1>
          <p className="text-sm text-slate-600">
            Les tests de matériel sont créés uniquement par les administrateurs et doivent être liés à un
            produit existant.
          </p>
        </div>
        <a href="/admin/tests" className="btn-outline text-sm">
          ← Retour à la liste des tests
        </a>
      </header>

      {/* Intro */}
      <section className="rounded-xl border border-dashed p-4 bg-surface/50">
        <p className="text-sm text-slate-600">
          Chaque test doit être associé à un produit déjà présent dans le catalogue. Un test peut contenir
          une bannière, une introduction, un contenu complet (éditeur WYSIWYG) et des notes par catégorie
          (Design, Prix, Confort…).
        </p>
      </section>

      {/* Formulaire de création */}
      <section className="rounded-xl border bg-surface/70 p-4">
        <h2 className="text-lg font-semibold mb-3">Informations du test</h2>
        <NewTestForm categories={categories} />
      </section>
    </div>
  );
}
