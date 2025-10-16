// src/app/admin/categories/partials/NewCategoryForm.tsx
"use client";

import { useState, FormEvent } from "react";
import { upsertCategory } from "@/app/actions/categories";

export default function NewCategoryForm() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOk(null);
    setErr(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    try {
      await upsertCategory({
        slug: String(fd.get("slug") ?? "").trim(),
        name: String(fd.get("name") ?? "").trim(),
        intro: fd.get("intro") ? String(fd.get("intro")) : undefined,
        content: fd.get("content") ? String(fd.get("content")) : undefined,
        metaTitle: fd.get("metaTitle") ? String(fd.get("metaTitle")) : undefined,
        metaDescription: fd.get("metaDescription") ? String(fd.get("metaDescription")) : undefined,
        published: String(fd.get("published") ?? "true") === "true",
      });

      setOk("Catégorie enregistrée !");
      (e.currentTarget as HTMLFormElement).reset();
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Slug</label>
          <input name="slug" required className="rounded-xl border border-ring px-3 py-2" placeholder="skis-all-mountain" />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">Nom</label>
          <input name="name" required className="rounded-xl border border-ring px-3 py-2" placeholder="Skis All-Mountain" />
        </div>
      </div>

      <div className="grid gap-1">
        <label className="text-sm">Intro (court)</label>
        <input name="intro" className="rounded-xl border border-ring px-3 py-2" />
      </div>

      <div className="grid gap-1">
        <label className="text-sm">Contenu (markdown ou texte)</label>
        <textarea name="content" rows={4} className="rounded-xl border border-ring px-3 py-2" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Meta title</label>
          <input name="metaTitle" className="rounded-xl border border-ring px-3 py-2" />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">Meta description</label>
          <input name="metaDescription" className="rounded-xl border border-ring px-3 py-2" />
        </div>
      </div>

      <div className="grid gap-1">
        <label className="text-sm">Publié ?</label>
        <select name="published" defaultValue="true" className="rounded-xl border border-ring px-3 py-2">
          <option value="true">Oui</option>
          <option value="false">Non</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
        {ok && <span className="text-sm text-green-600">{ok}</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>
    </form>
  );
}
