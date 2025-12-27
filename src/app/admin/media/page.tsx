// src/app/admin/media/page.tsx
"use client";

import { useEffect, useState } from "react";

type Asset = {
  id: number;
  publicUrl: string;
  title: string | null;
  alt: string | null;
  bytes: number | null;
  mime: string;
  slug: string;
};

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [alt, setAlt] = useState("");

  // ✅ Mode "sélection depuis l'éditeur" (popup)
  const [selectMode, setSelectMode] = useState(false);
  const [selectType, setSelectType] = useState<"image" | "video">("image");

  useEffect(() => {
    // On détecte les paramètres ?mode=select&type=image|video
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "select") {
        setSelectMode(true);
        const t = params.get("type");
        if (t === "video") setSelectType("video");
        else setSelectType("image");
      }
    }
  }, []);

  async function refresh() {
    const r = await fetch("/api/media/list", { cache: "no-store" });
    const j = await r.json();
    setAssets(j.assets || []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title);
    fd.append("alt", alt);
    const r = await fetch("/api/media/upload", { method: "POST", body: fd });
    if (r.ok) {
      setFile(null);
      setTitle("");
      setAlt("");
      await refresh();
    } else {
      alert("Erreur upload");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Supprimer ce média ?")) return;
    const r = await fetch(`/api/media/${id}`, { method: "DELETE" });
    if (r.ok) refresh();
    else alert("Impossible de supprimer");
  }

  // ✅ Sélection d’un média pour l’éditeur visuel
  function onSelect(asset: Asset) {
    if (!selectMode) return;

    try {
      if (window.opener) {
        window.opener.postMessage(
          {
            type: "media-selected",
            payload: {
              url: asset.publicUrl,
              alt: asset.alt || asset.title || "",
              kind: selectType, // "image" ou "video" (pour l’instant on gère surtout l’image)
            },
          },
          window.location.origin
        );
      }
    } catch (e) {
      console.error("postMessage error", e);
    }

    // On ferme la popup après sélection
    window.close();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Médiathèque</h1>

        {selectMode && (
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
            Mode sélection&nbsp;: cliquez sur une image pour l&apos;insérer dans le contenu
          </div>
        )}
      </div>

      {/* Formulaire d’upload (conservé même en mode select, pratique si on veut téléverser puis choisir) */}
      <form onSubmit={onUpload} className="rounded-xl border p-4 space-y-3 bg-white">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
              required
            />
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre (optionnel)"
                className="rounded-lg border px-3 py-2 text-sm w-full"
              />
              <input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Texte alternatif (recommandé)"
                className="rounded-lg border px-3 py-2 text-sm w-full"
              />
            </div>
          </div>
          <div className="self-end">
            <button className="btn w-full">Téléverser</button>
          </div>
        </div>
      </form>

      {/* Grille des médias */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {assets.map((a) => (
          <div
            key={a.id}
            className={
              "rounded-xl border overflow-hidden bg-white flex flex-col " +
              (selectMode ? "cursor-pointer hover:border-brand-500 hover:shadow-card transition" : "")
            }
            onClick={() => selectMode && onSelect(a)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={a.publicUrl}
              alt={a.alt || a.title || ""}
              className="aspect-square object-cover w-full"
            />
            <div className="p-2 text-xs flex-1 flex flex-col">
              <div className="font-medium truncate">{a.title || a.slug}</div>
              <div className="text-slate-500 truncate">{a.mime}</div>

              {!selectMode && (
                <button
                  type="button"
                  className="mt-1 text-red-600 hover:underline self-start"
                  onClick={(e) => {
                    e.stopPropagation(); // évite de déclencher la sélection
                    onDelete(a.id);
                  }}
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
