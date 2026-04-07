// src/app/admin/guide-categories/partials/GuideCategoryForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";

type GuideCategoryData = {
  id?: number;
  name?: string;
  slug?: string;
  description?: string | null;
  order?: number;
  isInMenu?: boolean;
  active?: boolean;
};

export default function GuideCategoryForm({
  initial,
}: {
  initial?: GuideCategoryData;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [slugPreview, setSlugPreview] = useState(initial?.slug ?? "");

  function handleNameBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (initial?.slug) return;
    const generated = slugify(e.currentTarget.value || "");
    setSlugPreview(generated);
  }

  function handleSlugBlur(e: React.FocusEvent<HTMLInputElement>) {
    const value = slugify(e.currentTarget.value || "");
    e.currentTarget.value = value;
    setSlugPreview(value);
  }

  async function onSubmit(formData: FormData) {
    setSaving(true);

    const res = await fetch(
      initial?.id
        ? `/api/admin/guide-categories/${initial.id}`
        : `/api/admin/guide-categories`,
      {
        method: initial?.id ? "PUT" : "POST",
        body: formData,
      }
    );

    setSaving(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      alert(payload?.error || "Erreur lors de l’enregistrement");
      return;
    }

    if (initial?.id) {
      router.push(`/admin/guide-categories/${initial.id}/edit`);
      router.refresh();
      return;
    }

    const payload = await res.json().catch(() => null);
    if (payload?.id) {
      router.push(`/admin/guide-categories/${payload.id}/edit`);
      return;
    }

    router.push("/admin/guide-categories");
    router.refresh();
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          {initial?.id ? (
            <span className="text-xs text-slate-500">
              ID #{initial.id} {slugPreview ? `· ancre /pages#${slugPreview}` : ""}
            </span>
          ) : (
            <span className="text-xs text-slate-500">
              Cette catégorie pourra être utilisée dans le hub Guides et dans le menu.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button disabled={saving} className="btn">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>

      <div className="card grid gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Nom</label>
          <input
            name="name"
            defaultValue={initial?.name ?? ""}
            onBlur={handleNameBlur}
            className="input"
            placeholder="Ex : Bien choisir son matériel"
            required
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Slug</label>
          <input
            name="slug"
            defaultValue={initial?.slug ?? ""}
            onBlur={handleSlugBlur}
            className="input"
            placeholder="ex: choisir-son-materiel"
            required
          />
          <p className="text-xs text-slate-500">
            Utilisé pour les ancres du hub guides et le menu :{" "}
            <code>/pages#{slugPreview || "ma-categorie"}</code>
          </p>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Description</label>
          <textarea
            name="description"
            defaultValue={initial?.description ?? ""}
            rows={4}
            className="input"
            placeholder="Courte description affichée sur la page Guides."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Ordre</label>
            <input
              type="number"
              name="order"
              min={0}
              step={1}
              defaultValue={initial?.order ?? 0}
              className="input"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm mt-8">
            <input
              type="checkbox"
              name="isInMenu"
              defaultChecked={initial?.isInMenu ?? true}
            />
            <span>Afficher dans le menu Guides</span>
          </label>

          <label className="inline-flex items-center gap-2 text-sm mt-8">
            <input
              type="checkbox"
              name="active"
              defaultChecked={initial?.active ?? true}
            />
            <span>Catégorie active</span>
          </label>
        </div>
      </div>
    </form>
  );
}