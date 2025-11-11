// src/app/admin/pages/_PageForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { slugify } from "@/lib/slug";
import MediaPicker from "@/components/admin/MediaPicker";

type PageData = {
  id?: number;
  title?: string;
  slug?: string;
  intro?: string | null;
  content?: string;
  thumbnailUrl?: string | null;
  bannerUrl?: string | null;
  published?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  tags?: string[] | null;
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
    <form action={onSubmit} className="mx-auto max-w-3xl space-y-6">
      {/* Bloc Titre / Slug */}
      <section className="card">
        <h2 className="section-title">Informations principales</h2>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-sm">Titre</label>
            <input name="title" defaultValue={initial?.title ?? ""} className="input" required />
          </div>

          <div className="grid gap-1">
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

          <div className="grid gap-1">
            <label className="text-sm">Intro (meta/preview)</label>
            <textarea name="intro" defaultValue={initial?.intro ?? ""} rows={3} className="input" />
          </div>
        </div>
      </section>

      {/* Bloc Images (vertical) */}
      <section className="card">
        <h2 className="section-title">Illustrations</h2>

        <div className="grid gap-4">
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
      </section>

      {/* Bloc Contenu */}
      <section className="card">
        <h2 className="section-title">Contenu</h2>
        <RichTextEditor
          name="content"
          label="Contenu (WYSIWYG / HTML)"
          initialValue={initial?.content ?? ""}
          rows={18}
        />
      </section>

      {/* Bloc SEO */}
      <section className="card">
        <h2 className="section-title">SEO</h2>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-sm">Meta Title</label>
            <input name="metaTitle" defaultValue={initial?.metaTitle ?? ""} className="input" />
          </div>
          <div className="grid gap-1">
            <label className="text-sm">Meta Description</label>
            <input name="metaDescription" defaultValue={initial?.metaDescription ?? ""} className="input" />
          </div>
        </div>
      </section>

      {/* Bloc Publication */}
      <section className="card">
        <h2 className="section-title">Publication</h2>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-sm">Tags (séparés par des virgules)</label>
            <input name="tags" defaultValue={initial?.tags?.join(", ") ?? ""} className="input" />
          </div>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="published" defaultChecked={initial?.published ?? false} />
            <span className="text-sm">Publié</span>
          </label>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button disabled={saving} className="btn">{saving ? "Enregistrement…" : "Enregistrer"}</button>
      </div>
    </form>
  );
}
