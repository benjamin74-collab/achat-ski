// src/app/admin/categories/partials/EditCategoryForm.tsx
"use client";

import { useState, FormEvent } from "react";
import { upsertCategory } from "@/app/actions/categories";
import RichTextEditor from "@/components/admin/RichTextEditor";

export type ParentOption = { id: number; name: string };

type Initial = {
  id: number;
  slug: string;
  name: string;
  intro: string | null;
  content: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  parentId: number | null;
  isInMenu: boolean;
  order: number;
  published: boolean;
  mapKwanko: string[];
  mapEkosport: string[];
  mapSnowleader: string[];
  mapGlisshop: string[];
  aliases: string[];
};

export default function EditCategoryForm({
  initial,
  parents = [],
}: {
  initial: Initial;
  parents?: ParentOption[];
}) {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const arrToLines = (a?: string[] | null) => (a && a.length ? a.join("\n") : "");

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

        parentId: String(fd.get("parentId") ?? "") || null,
        isInMenu: String(fd.get("isInMenu") ?? "true") === "true",
        order: Number(fd.get("order") ?? 0),
        published: String(fd.get("published") ?? "true") === "true",

        mapKwanko: String(fd.get("mapKwanko") || "").split("\n").map(s => s.trim()).filter(Boolean),
        mapEkosport: String(fd.get("mapEkosport") || "").split("\n").map(s => s.trim()).filter(Boolean),
        mapSnowleader: String(fd.get("mapSnowleader") || "").split("\n").map(s => s.trim()).filter(Boolean),
        mapGlisshop: String(fd.get("mapGlisshop") || "").split("\n").map(s => s.trim()).filter(Boolean),
        aliases: String(fd.get("aliases") || "").split("\n").map(s => s.trim()).filter(Boolean),
      });

      setOk("Catégorie mise à jour !");
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {/* Slug / Nom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Slug</label>
          <input name="slug" required defaultValue={initial.slug} className="rounded-xl border border-ring px-3 py-2" />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">Nom</label>
          <input name="name" required defaultValue={initial.name} className="rounded-xl border border-ring px-3 py-2" />
        </div>
      </div>

      {/* Parent / Menu / Ordre / Publié */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Parent</label>
          <select name="parentId" className="rounded-xl border border-ring px-3 py-2" defaultValue={initial.parentId ?? ""}>
            <option value="">— Aucun —</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-1">
          <label className="text-sm">Afficher dans le menu ?</label>
          <select name="isInMenu" defaultValue={initial.isInMenu ? "true" : "false"} className="rounded-xl border border-ring px-3 py-2">
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        </div>

        <div className="grid gap-1">
          <label className="text-sm">Ordre (menu)</label>
          <input name="order" type="number" defaultValue={initial.order ?? 0} className="rounded-xl border border-ring px-3 py-2" />
        </div>

        <div className="grid gap-1">
          <label className="text-sm">Publié ?</label>
          <select name="published" defaultValue={initial.published ? "true" : "false"} className="rounded-xl border border-ring px-3 py-2">
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        </div>
      </div>

      {/* Intro */}
      <div className="grid gap-1">
        <label className="text-sm">Intro (court)</label>
        <input name="intro" defaultValue={initial.intro ?? ""} className="rounded-xl border border-ring px-3 py-2" />
      </div>

      {/* ✅ Contenu WYSIWYG */}
      <RichTextEditor
        name="content"
        label="Contenu (WYSIWYG)"
        initialValue={initial.content ?? ""}
        rows={12}
      />

      {/* SEO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Meta title</label>
          <input name="metaTitle" defaultValue={initial.metaTitle ?? ""} className="rounded-xl border border-ring px-3 py-2" />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">Meta description</label>
          <input name="metaDescription" defaultValue={initial.metaDescription ?? ""} className="rounded-xl border border-ring px-3 py-2" />
        </div>
      </div>

      {/* Mappings affiliés */}
      <div className="grid gap-1">
        <label className="text-sm">Mappings Kwanko (1 par ligne)</label>
        <textarea name="mapKwanko" rows={3} defaultValue={arrToLines(initial.mapKwanko)} className="rounded-xl border border-ring px-3 py-2" />
      </div>
      <div className="grid gap-1">
        <label className="text-sm">Mappings Ekosport (1 par ligne)</label>
        <textarea name="mapEkosport" rows={3} defaultValue={arrToLines(initial.mapEkosport)} className="rounded-xl border border-ring px-3 py-2" />
      </div>
      <div className="grid gap-1">
        <label className="text-sm">Mappings Snowleader (1 par ligne)</label>
        <textarea name="mapSnowleader" rows={3} defaultValue={arrToLines(initial.mapSnowleader)} className="rounded-xl border border-ring px-3 py-2" />
      </div>
      <div className="grid gap-1">
        <label className="text-sm">Mappings Glisshop (1 par ligne)</label>
        <textarea name="mapGlisshop" rows={3} defaultValue={arrToLines(initial.mapGlisshop)} className="rounded-xl border border-ring px-3 py-2" />
      </div>

      {/* Aliases */}
      <div className="grid gap-1">
        <label className="text-sm">Aliases / Slugs secondaires (1 par ligne)</label>
        <textarea name="aliases" rows={2} defaultValue={arrToLines(initial.aliases)} className="rounded-xl border border-ring px-3 py-2" placeholder={"allmountain\npolyvalent"} />
      </div>

      <div className="flex items-center gap-3">
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Mise à jour..." : "Enregistrer"}
        </button>
        {ok && <span className="text-sm text-green-600">{ok}</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>
    </form>
  );
}
