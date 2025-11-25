// src/app/admin/tests/page.tsx
import { prisma } from "@/lib/prisma";
import NewTestForm from "./partials/NewTestForm";

export const revalidate = 0;

export default async function TestsAdminPage() {
  const categories = await prisma.testRatingCategory.findMany({
    orderBy: [{ order: "asc" }, { label: "asc" }],
  });

  return (
    <div className="grid gap-8">
      {/* Intro */}
      <section className="rounded-xl border border-dashed p-4 bg-surface/50">
        <p className="text-sm text-slate-600">
          Les tests de matériel sont créés uniquement par les administrateurs
          depuis cette page. Chaque test doit être lié à un produit existant,
          contenir une bannière, une introduction, un contenu complet (éditeur WYSIWYG)
          et des notes pour une ou plusieurs catégories (Design, Prix, Confort, etc.).
        </p>
      </section>

      {/* Création d'un nouveau test */}
      <section className="rounded-xl border bg-surface/70 p-4">
        <h2 className="text-lg font-semibold mb-3">Créer un nouveau test</h2>
        <NewTestForm categories={categories} />
      </section>
    </div>
  );
}
