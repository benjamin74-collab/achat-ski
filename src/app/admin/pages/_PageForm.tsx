// src/app/admin/pages/_PageForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";
import MediaPicker from "@/components/admin/MediaPicker";
import RichTextEditor from "@/components/admin/RichTextEditor";

type PageData = {
  id?: number;
  title?: string;
  slug?: string;
  intro?: string | null;
  content?: string;
  // Fallback URLs
  thumbnailUrl?: string | null;
  bannerUrl?: string | null;
  published?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  tags?: string[] | null;

  // Pré-remplissage médiathèque
  thumbnailAssetId?: number | null;
  thumbnailAssetUrl?: string | null;
  bannerAssetId?: number | null;
  bannerAssetUrl?: string | null;
};

type TabKey = "infos" | "content" | "seo";

export default function PageForm({ initial }: { initial?: PageData }) {
  const r = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("infos");

  async function onSubmit(formData: FormData) {
    setSaving(true);
    const res = await fetch(
      initial?.id ? `/api/admin/pages/${initial.id}` : `/api/admin/pages`,
      {
        method: initial?.id ? "PUT" : "POST",
        body: formData,
      }
    );
    setSaving(false);
    if (res.ok) {
      const { slug } = await res.json();
      r.push(`/pages/${slug}`);
    }
  }

  const initialThumb =
    initial?.thumbnailAssetId && initial?.thumbnailAssetUrl
      ? {
          id: initial.thumbnailAssetId,
          url: initial.thumbnailAssetUrl,
          filename: null,
          alt: null,
        }
      : null;

  const initialBanner =
    initial?.bannerAssetId && initial?.bannerAssetUrl
      ? {
          id: initial.bannerAssetId,
          url: initial.bannerAssetUrl,
          filename: null,
          alt: null,
        }
      : null;

  const tabBtnBase =
    "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors";
  const tabInactive =
    "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200";
  const tabActive = "border-brand-500 text-brand-700";

  return (
    <form
      action={onSubmit}
      className="grid gap-4 max-w-4xl mx-auto"
      autoComplete="off"
    >
      {/* Onglets */}
      <div className="card">
        <div className="border-b border-slate-200 mb-4">
          <nav className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("infos")}
              className={`${tabBtnBase} ${
                activeTab === "infos" ? tabActive : tabInactive
              }`}
            >
              Infos générales
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("content")}
              className={`${tabBtnBase} ${
                activeTab === "content" ? tabActive : tabInactive
              }`}
            >
              Contenu
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("seo")}
              className={`${tabBtnBase} ${
                activeTab === "seo" ? tabActive : tabInactive
              }`}
            >
              SEO & Tags
            </button>
          </nav>
        </div>

        {/* ONGLET 1 : INFOS GÉNÉRALES */}
        {activeTab === "infos" && (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Titre</label>
              <input
                name="title"
                defaultValue={initial?.title ?? ""}
                className="input"
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Slug (URL)</label>
              <input
                name="slug"
                defaultValue={initial?.slug ?? ""}
                onBlur={(e) =>
                  (e.currentTarget.value = slugify(
                    e.currentTarget.value || ""
                  ))
                }
                className="input"
                placeholder="ex: comparatif-chaussures-ski-2025"
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Chapeau / Intro (facultatif)
              </label>
              <textarea
                name="intro"
                defaultValue={initial?.intro ?? ""}
                rows={3}
                className="input"
                placeholder="Court paragraphe d’introduction affiché en haut de l’article et dans les listes."
              />
            </div>

            {/* Miniature */}
            <div className="grid gap-2">
              <MediaPicker
                label="Miniature (médiathèque)"
                nameId="thumbnailAssetId"
                kind="page-thumb"
                folder="pages/thumbs"
                accept="image/*"
                initial={initialThumb}
              />
              <label className="text-sm">Miniature (URL externe – optionnel)</label>
              <input
                name="thumbnailUrl"
                defaultValue={initial?.thumbnailUrl ?? ""}
                className="input"
                placeholder="https://…"
              />
            </div>

            {/* Bannière – maintenant juste en dessous de la miniature */}
            <div className="grid gap-2">
              <MediaPicker
                label="Bannière (médiathèque)"
                nameId="bannerAssetId"
                kind="page-banner"
                folder="pages/banners"
                accept="image/*"
                initial={initialBanner}
              />
              <label className="text-sm">Bannière (URL externe – optionnel)</label>
              <input
                name="bannerUrl"
                defaultValue={initial?.bannerUrl ?? ""}
                className="input"
                placeholder="https://…"
              />
            </div>
          </div>
        )}

        {/* ONGLET 2 : CONTENU */}
        {activeTab === "content" && (
          <div className="grid gap-4">
            <RichTextEditor
              name="content"
              label="Contenu de la page"
              initialValue={initial?.content ?? ""}
            />
          </div>
        )}

        {/* ONGLET 3 : SEO + TAGS */}
        {activeTab === "seo" && (
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Meta Title</label>
                <input
                  name="metaTitle"
                  defaultValue={initial?.metaTitle ?? ""}
                  className="input"
                  placeholder="Titre SEO (si vide, le titre sera utilisé)"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Meta Description</label>
                <input
                  name="metaDescription"
                  defaultValue={initial?.metaDescription ?? ""}
                  className="input"
                  placeholder="Description SEO (150–160 caractères recommandés)"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Tags (séparés par des virgules)
              </label>
              <input
                name="tags"
                defaultValue={initial?.tags?.join(", ") ?? ""}
                className="input"
                placeholder="chaussures de ski, comparatif, freeride…"
              />
            </div>

            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="published"
                defaultChecked={initial?.published ?? false}
              />
              <span className="text-sm">Publié</span>
            </label>
          </div>
        )}
      </div>

      {/* Boutons d’action */}
      <div className="flex items-center justify-between gap-3">
        {initial?.id && initial.slug && (
          <a
            href={`/pages/${initial.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            Visualiser
          </a>
        )}

        <div className="flex gap-2 ml-auto">
          <button disabled={saving} className="btn">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </form>
  );
}
