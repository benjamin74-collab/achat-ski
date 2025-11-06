// src/components/admin/MediaPicker.tsx
"use client";

import { useState, useRef } from "react";

type MediaAsset = {
  id: number;
  url: string;
  filename: string | null;
  alt: string | null;
};

type Props = {
  label?: string;
  nameId?: string;          // input hidden: ex. "logoAssetId"
  initial?: MediaAsset | null;
  accept?: string;          // ex. "image/*"
  folder?: string;          // ex. "brands"
  kind?: string;            // ex. "brand-logo"
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

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("folder", folder);
      fd.append("kind", kind);

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      const a: MediaAsset = {
        id: json.asset.id,
        url: json.asset.url,
        filename: json.asset.filename,
        alt: json.asset.alt,
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
            <img src={asset.url} alt={asset.alt ?? ""} className="h-full w-full object-contain" />
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

      {/* Valeur réelle envoyée au form */}
      <input type="hidden" name={nameId} value={asset?.id ?? ""} />
    </div>
  );
}
