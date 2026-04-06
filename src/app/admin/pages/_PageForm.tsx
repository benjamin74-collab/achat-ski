// src/app/admin/pages/_PageForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";
import MediaPicker from "@/components/admin/MediaPicker";
import RichTextEditor from "@/components/admin/RichTextEditor";

type GuideCategoryOption = {
  id: number;
  name: string;
};

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

  thumbnailAssetId?: number | null;
  thumbnailAssetUrl?: string | null;
  bannerAssetId?: number | null;
  bannerAssetUrl?: string | null;

  kind?: "GUIDE" | "COMPARATIF" | "ARTICLE";
  guideCategoryId?: number | null;
};

type TabKey = "general" | "content" | "seo";

function TabPanel({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={active ? "block" : "hidden"}
      aria-hidden={!active}
    >
      {children}
    </div>
  );
}

export default function PageForm({
  initial,
  guideCategories = [],
}: {
  initial?: PageData;
  guideCategories?: GuideCategoryOption[];
}) {
  const r = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  const [currentSlug, setCurrentSlug] = useState<string>(initial?.slug ?? "");
  const [kind, setKind] = useState<"GUIDE" | "COMPARATIF" | "ARTICLE">(
    initial?.kind ?? "ARTICLE"
  );

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

    if (initial?.id) {
      r.push(`/admin/pages/${initial.id}/edit`);
      r.refresh();
      return;
    }

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

  const showGuideCategory = kind === "GUIDE";

  return (
    <form action={onSubmit} className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
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

      <TabPanel active={activeTab === "general"}>
        <div className="card grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="text-sm font-medium text-slate-700">Type de contenu</label>
              <select
                name="kind"
                className="input"
                value={kind}
                onChange={(e) =>
                  setKind(e.target.value as "GUIDE" | "COMPARATIF" | "ARTICLE")
                }
              >
                <option value="ARTICLE">Article</option>
                <option value="GUIDE">Guide</option>
                <option value="COMPARATIF">Comparatif</option>
              </select>
            </div>
          </div>

          {showGuideCategory ? (
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">
                Catégorie de guide
              </label>
              <select
                name="guideCategoryId"
                defaultValue={initial?.guideCategoryId?.toString() ?? ""}
                className="input"
              >
                <option value="">Aucune catégorie</option>
                {guideCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                Visible dans le hub Guides et dans le menu sous “Guides”.
              </p>
            </div>
          ) : (
            <input type="hidden" name="guideCategoryId" value="" />
          )}

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