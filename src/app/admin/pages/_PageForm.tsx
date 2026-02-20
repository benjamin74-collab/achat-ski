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

type TabKey = "general" | "content" | "seo";

function TabPanel({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  // Important:
  // - on ne démonte PAS => les inputs & l'éditeur gardent leur état
  // - on cache via CSS + on retire de la navigation clavier / lecteurs
  return (
    <div
      className={active ? "block" : "hidden"}
      aria-hidden={!active}
    >
      {children}
    </div>
  );
}

export default function PageForm({ initial }: { initial?: PageData }) {
  const r = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  const [currentSlug, setCurrentSlug] = useState<string>(initial?.slug ?? "");

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

  if (!res.ok) {
    alert("Erreur lors de l’enregistrement");
    return;
  }

  // On évite le push vers /pages/[slug] (qui peut 404 si non publié)
  if (initial?.id) {
    r.push(`/admin/pages/${initial.id}/edit`);
    return;
  }

  // Création : l’API doit idéalement renvoyer l’id créé
  // Si elle ne le fait pas, on fallback sur /admin/pages
  try {
    const json = (await res.json()) as { id?: number };
    if (json?.id) r.push(`/admin/pages/${json.id}/edit`);
    else r.push(`/admin/pages`);
  } catch {
    r.push(`/admin/pages`);
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

  function handleSlugBlur(e: React.FocusEvent<HTMLInputElement>) {
    const raw = e.currentTarget.value || "";
    const s = slugify(raw);
    e.currentTarget.value = s;
    setCurrentSlug(s);
  }

  function handlePreviewClick() {
    if (!currentSlug) return;
    window.open(`/pages/${currentSlug}`, "_blank", "noopener,noreferrer");
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      {/* Bandeau top : publié + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="published"
              defaultChecked={initial?.published ?? false}
            />
            <span>Publié</span>
          </label>
          {initial?.id && (
            <span className="text-xs text-slate-500">
              ID #{initial.id} {currentSlug && `· /pages/${currentSlug}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={handlePreviewClick}
            disabled={!currentSlug}
          >
            Visualiser
          </button>
          <button disabled={saving} className="btn">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="border-b border-slate-200 flex gap-2 mt-1">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`px-3 py-2 text-sm border-b-2 -mb-px ${
            activeTab === "general"
              ? "border-brand-500 text-brand-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Infos générales
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={`px-3 py-2 text-sm border-b-2 -mb-px ${
            activeTab === "content"
              ? "border-brand-500 text-brand-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Contenu
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("seo")}
          className={`px-3 py-2 text-sm border-b-2 -mb-px ${
            activeTab === "seo"
              ? "border-brand-500 text-brand-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          SEO & Tags
        </button>
      </div>

      {/* ✅ On garde les 3 panneaux MONTÉS, on cache seulement */}
      <TabPanel active={activeTab === "general"}>
        <div className="card grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Titre</label>
            <input
              name="title"
              defaultValue={initial?.title ?? ""}
              className="input"
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">
              Slug (URL)
            </label>
            <input
              name="slug"
              defaultValue={initial?.slug ?? ""}
              onBlur={handleSlugBlur}
              className="input"
              placeholder="ex: bien-choisir-ses-fixations"
              required
            />
            <p className="text-xs text-slate-500">
              Utilisé pour l’URL : <code>/pages/{currentSlug || "mon-article"}</code>
            </p>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">
              Intro (chapeau / meta preview)
            </label>
            <textarea
              name="intro"
              defaultValue={initial?.intro ?? ""}
              rows={3}
              className="input"
              placeholder="Court résumé de l’article (utilisé comme chapeau et fallback meta description)."
            />
          </div>

          {/* Miniature puis bannière, l’une sous l’autre */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <MediaPicker
                label="Miniature (médiathèque)"
                nameId="thumbnailAssetId"
                kind="page-thumb"
                folder="pages/thumbs"
                accept="image/*"
                initial={initialThumb}
              />
              <label className="text-xs text-slate-500">
                Miniature (URL externe – optionnel)
              </label>
              <input
                name="thumbnailUrl"
                defaultValue={initial?.thumbnailUrl ?? ""}
                className="input"
                placeholder="https://…"
              />
            </div>

            <div className="grid gap-2">
              <MediaPicker
                label="Bannière (médiathèque)"
                nameId="bannerAssetId"
                kind="page-banner"
                folder="pages/banners"
                accept="image/*"
                initial={initialBanner}
              />
              <label className="text-xs text-slate-500">
                Bannière (URL externe – optionnel)
              </label>
              <input
                name="bannerUrl"
                defaultValue={initial?.bannerUrl ?? ""}
                className="input"
                placeholder="https://…"
              />
            </div>
          </div>
        </div>
      </TabPanel>

      <TabPanel active={activeTab === "content"}>
        <div className="card">
          <RichTextEditor
            name="content"
            label="Contenu de la page"
            initialValue={initial?.content ?? ""}
          />
        </div>
      </TabPanel>

      <TabPanel active={activeTab === "seo"}>
        <div className="card grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">
                Meta Title
              </label>
              <input
                name="metaTitle"
                defaultValue={initial?.metaTitle ?? ""}
                className="input"
                placeholder="Titre SEO (sinon titre de l’article)"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">
                Meta Description
              </label>
              <input
                name="metaDescription"
                defaultValue={initial?.metaDescription ?? ""}
                className="input"
                placeholder="Description SEO (sinon intro de l’article)"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">
              Tags (séparés par des virgules)
            </label>
            <input
              name="tags"
              defaultValue={initial?.tags?.join(", ") ?? ""}
              className="input"
              placeholder="chaussures de ski, ajustement, confort…"
            />
          </div>
        </div>
      </TabPanel>
    </form>
  );
}