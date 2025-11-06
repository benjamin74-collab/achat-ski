"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HtmlEditor from "@/app/admin/categories/partials/HtmlEditor";
import { slugify } from "@/lib/slug";
import MediaPicker from "@/components/admin/MediaPicker";

type PageData = {
  id?: number;
  title?: string;
  slug?: string;
  intro?: string | null;
  content?: string;
  thumbnailUrl?: string | null; // fallback URL
  bannerUrl?: string | null;    // fallback URL
  published?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  tags?: string[] | null;
  // si tu veux pré-remplir un jour :
  // thumbnailAssetId?: number | null;
  // bannerAssetId?: number | null;
};

export default function PageForm({ initial }: { initial?: PageData }) {
  const r = useRouter();
  const [saving, setSaving] = useState(false);

  async function onSubmit(formData: FormData) {
    setSaving(true);
    const res = await fetch(initial?.id ? `/api/admin/pages/${initial.id}` : `/api/admin/pages`, {
      method: initial?.id ? "PUT" : "POST",
      body: formData,
    });
    setSaving(false);
    if (res.ok) {
      const { slug } = await res.json();
      r.push(`/pages/${slug}`);
    }
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm">Titre</label>
        <input name="title" defaultValue={initial?.title ?? ""} className="input" required />
      </div>

      <div className="grid gap-2">
        <label className="text-sm">Slug</label>
        <input
          name="slug"
          defaultValue={initial?.slug ?? ""}
          onBlur={(e) => (e.currentTarget.value = slugify(e.currentTarget.value || ""))}
          className="input"
          placeholder="ex: bien-choisir-ses-fixations"
          required
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm">Intro (meta/preview)</label>
        <textarea name="intro" defaultValue={initial?.intro ?? ""} rows={3} className="input" />
      </div>

      {/* ── Miniature & Bannière via médiathèque + fallback URL ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <MediaPicker
            label="Miniature (médiathèque)"
            nameId="thumbnailAssetId"
            kind="page-thumb"
            folder="pages/thumbs"
            accept="image/*"
            initial={null}
          />
          <label className="text-sm">Miniature (URL externe – optionnel)</label>
          <input name="thumbnailUrl" defaultValue={initial?.thumbnailUrl ?? ""} className="input" />
        </div>

        <div className="grid gap-2">
          <MediaPicker
            label="Bannière (médiathèque)"
            nameId="bannerAssetId"
            kind="page-banner"
            folder="pages/banners"
            accept="image/*"
            initial={null}
          />
          <label className="text-sm">Bannière (URL externe – optionnel)</label>
          <input name="bannerUrl" defaultValue={initial?.bannerUrl ?? ""} className="input" />
        </div>
      </div>

      <HtmlEditor name="content" initialValue={initial?.content ?? ""} label="Contenu (HTML)" rows={16} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-sm">Meta Title</label>
          <input name="metaTitle" defaultValue={initial?.metaTitle ?? ""} className="input" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm">Meta Description</label>
          <input name="metaDescription" defaultValue={initial?.metaDescription ?? ""} className="input" />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm">Tags (séparés par des virgules)</label>
        <input name="tags" defaultValue={initial?.tags?.join(", ") ?? ""} className="input" />
      </div>

      <label className="inline-flex items-center gap-2">
        <input type="checkbox" name="published" defaultChecked={initial?.published ?? false} />
        <span className="text-sm">Publié</span>
      </label>

      <div className="flex gap-2">
        <button disabled={saving} className="btn">{saving ? "Enregistrement…" : "Enregistrer"}</button>
      </div>
    </form>
  );
}
