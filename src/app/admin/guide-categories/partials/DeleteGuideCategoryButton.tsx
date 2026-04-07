// src/app/admin/guide-categories/partials/DeleteGuideCategoryButton.tsx
"use client";

import { useRouter } from "next/navigation";

export default function DeleteGuideCategoryButton({
  id,
  name,
  linkedPagesCount,
}: {
  id: number;
  name: string;
  linkedPagesCount: number;
}) {
  const router = useRouter();

  async function handleDelete() {
    if (linkedPagesCount > 0) {
      alert(
        `Impossible de supprimer "${name}" : ${linkedPagesCount} page(s) y sont encore rattachée(s).`
      );
      return;
    }

    const ok = window.confirm(`Supprimer la catégorie "${name}" ?`);
    if (!ok) return;

    const res = await fetch(`/api/admin/guide-categories/${id}`, {
      method: "DELETE",
    });

    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      alert(payload?.error || "Erreur lors de la suppression");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="text-red-600 underline hover:text-red-700"
    >
      Supprimer
    </button>
  );
}