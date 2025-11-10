// src/components/admin/MediaPicker.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type MediaAsset = {
  id: number;
  url: string;                 // Toujours une URL publique utilisable (publicUrl || url)
  filename?: string | null;
  alt?: string | null;
};

type Props = {
  label?: string;
  nameId?: string;             // input hidden: ex. "logoAssetId"
  initial?: MediaAsset | null;
  accept?: string;             // ex. "image/*"
  folder?: string;             // ex. "brands"
  kind?: string;               // ex. "brand-logo"
  onChange?: (a: MediaAsset | null) => void;
};

export default function MediaPicker({
  label = "Image",
  nameId = "assetId",
  initial = null,
  accept = "image/*",
  folder = "uploads",
  kind = "generic",
  onChange,
}: Props) {
  const [asset, setAsset] = useState<MediaAsset | null>(initial);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Si le parent change la valeur initiale (édition d’une page), on resynchronise l’aperçu
  useEffect(() => {
    setAsset(initial ?? null);
  }, [initial]);

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("folder", folder);
      fd.append("kind", kind);

      const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const json = await res.json() as {
        asset: {
          id: number;
          publicUrl?: string | null;   // nouveau schéma
          url?: string | null;         // rétro-compat
          filename?: string | null;
          alt?: string | null;
        }
      };

      const publicUrl = json.asset.publicUrl ?? json.asset.url ?? "";
      if (!publicUrl) throw new Error("No public URL returned by API");

      const a: MediaAsset = {
        id: json.asset.id,
        url: publicUrl,
        filename: json.asset.filename ?? null,
        alt: json.asset.alt ?? null,
      };
      setAsset(a);
      onChange?.(a);
    } catch (err) {
      console.error(err);
      alert("Échec de l’upload");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function remove() {
    setAsset(null);
    onChange?.(null);
  }

  return (
    <div className="grid gap-2">
      <label className="text-sm">{label}</label>

      <div className="flex items-center gap-3">
        <div className="h-16 w-16 rounded-lg border bg-white overflow-hidden flex items-center justify-center">
          {asset?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.url}
              alt={asset.alt ?? ""}
              className="h-full w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="text-xs text-neutral-400">Aucune</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            onChange={handleSelect}
            disabled={busy}
          />
          {asset && (
            <button type="button" onClick={remove} className="btn-outline btn-sm">
              Retirer
            </button>
          )}
        </div>
      </div>

      {/* Valeur envoyée au form = l'ID de l'asset (côté API on connecte/disconnecte) */}
      <input type="hidden" name={nameId} value={asset?.id ?? ""} />
    </div>
  );
}
