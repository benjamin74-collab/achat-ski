// src/app/admin/pages/_PageForm.tsx
"use client";

import { useMemo, useRef, useState } from "react";
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

type MediaInit = { id: number; url: string; filename: string | null; alt: string | null } | null;

export default function PageForm({ initial }: { initial?: PageData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // === État local pour calculer le lien "Visualiser" ===
  const [title, setTitle] = useState<string>(initial?.title ?? "");
  const [slug, setSlug]   = useState<string>(initial?.slug ?? "");

  const computedSlug = useMemo(() => {
    const raw = slug?.trim() || slugify(title || "");
    return slugify(raw);
  }, [slug, title]);

  const previewHref = useMemo(() => `/pages/${computedSlug || "preview"}`, [computedSlug]);

  // === Pré-remplissage des pickers média ===
  const initialThumb: MediaInit =
    initial?.thumbnailAssetId && initial?.thumbnailAssetUrl
      ? { id: initial.thumbnailAssetId, url: initial.thumbnailAssetUrl, filename: null, alt: null }
      : null;

  const initialBanner: MediaInit =
    initial?.bannerAssetId && initial?.bannerAssetUrl
      ? { id: initial.bannerAssetId, url: initial.bannerAssetUrl, filename: null, alt: null }
      : null;

  // === Tabs state ===
  type TabId = "meta" | "content" | "seo";
  const [tab, setTab] = useState<TabId>("meta");
  const formRef = useRef<HTMLFormElement | null>(null);

  async function onSubmit(formData: FormData) {
    setSaving(true);
    const url = initial?.id ? `/api/admin/pages/${initial.id}` : `/api/admin/pages`;
    const method = initial?.id ? "PUT" : "POST";
    const res = await fetch(url, { method, body: formData });
    setSaving(false);
    if (res.ok) {
      const { slug: nextSlug } = (await res.json()) as { slug: string };
      router.push(`/pages/${nextSlug}`);
    }
  }

  // Accessibilité : navigation au clavier des onglets
  function onTabsKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const order: TabId[] = ["meta", "content", "seo"];
    const currentIndex = order.indexOf(tab);
    if (currentIndex < 0) return;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setTab(order[(currentIndex + 1) % order.length]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setTab(order[(currentIndex - 1 + order.length) % order.length]);
    }
  }

  return (
    <form ref={formRef} action={onSubmit} className="grid gap-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Nouvelle page</h1>
        <div className="flex items-center gap-2">
          <a
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
            title="Ouvrir la page dans un nouvel onglet"
          >
            Visualiser
          </a>
          <button disabled={saving} className="btn">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>

      {/* Tabs nav */}
      <div
        role="tablist"
        aria-label="Édition de page"
        onKeyDown={onTabsKeyDown}
        className="flex w-full rounded-xl border border-slate-200 bg-white p-1 overflow-x-auto"
      >
        {([
          { id: "meta",    label: "Informations" },
          { id: "content", label: "Contenu" },
          { id: "seo",     label: "SEO & Tags" },
        ] as Array<{ id: TabId; label: string }>).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              type="button"
              className={[
                "px-4 py-2 rounded-lg text-sm whitespace-nowrap",
                active
                  ? "bg-brand-500/10 text-ink border border-brand-200"
                  : "text-slate-600 hover:bg-slate-50"
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      {/* 1) METADATA de base */}
      {tab === "meta" && (
        <section id="panel-meta" role="tabpanel" aria-labelledby="tab-meta" className="grid gap-5">
          <div className="card">
            <h2 className="section-title">Titre & Slug</h2>
            <div className="grid gap-3">
              <div className="grid gap-2">
                <label className="text-sm">Titre</label>
                <input
                  name="title"
                  defaultValue={initial?.title ?? ""}
                  className="input"
                  required
                  onChange={(e) => setTitle(e.currentTarget.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm">Slug</label>
                <input
                  name="slug"
                  defaultValue={initial?.slug ?? ""}
                  className="input"
                  placeholder="ex: comparatif-chaussures-de-ski-2025"
                  onChange={(e) => setSlug(e.currentTarget.value)}
                  onBlur={(e) => {
                    const v = slugify(e.currentTarget.value || "");
                    e.currentTarget.value = v;
                    setSlug(v);
                  }}
                  required
                />
                <p className="text-xs text-slate-500">
                  URL : <span className="font-medium">/pages/{computedSlug || "…"}</span>
                </p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm">Intro (meta / preview)</label>
                <textarea
                  name="intro"
                  defaultValue={initial?.intro ?? ""}
                  rows={3}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">Miniature & Bannière</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                <label className="text-sm">Bannière (URL externe – optionnel)</label>
                <input
                  name="bannerUrl"
                  defaultValue={initial?.bannerUrl ?? ""}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" name="published" defaultChecked={initial?.published ?? false} />
              <span className="text-sm">Publié</span>
            </label>
          </div>
        </section>
      )}

      {/* 2) CONTENU */}
      {tab === "content" && (
        <section id="panel-content" role="tabpanel" aria-labelledby="tab-content" className="grid gap-5">
          <div className="card">
            <h2 className="section-title">Contenu</h2>
            <RichTextEditor
              name="content"
              label="Éditeur (WYSIWYG / HTML)"
              initialValue={initial?.content ?? ""}
            />
          </div>
        </section>
      )}

      {/* 3) SEO */}
      {tab === "seo" && (
        <section id="panel-seo" role="tabpanel" aria-labelledby="tab-seo" className="grid gap-5">
          <div className="card grid gap-3">
            <h2 className="section-title">SEO</h2>
            <div className="grid gap-2">
              <label className="text-sm">Meta Title</label>
              <input name="metaTitle" defaultValue={initial?.metaTitle ?? ""} className="input" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Meta Description</label>
              <input name="metaDescription" defaultValue={initial?.metaDescription ?? ""} className="input" />
            </div>
          </div>

          <div className="card grid gap-3">
            <h2 className="section-title">Tags</h2>
            <div className="grid gap-2">
              <label className="text-sm">Tags (séparés par des virgules)</label>
              <input name="tags" defaultValue={initial?.tags?.join(", ") ?? ""} className="input" />
            </div>
          </div>
        </section>
      )}
    </form>
  );
}
