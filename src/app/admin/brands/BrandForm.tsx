// src/app/admin/brands/BrandForm.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import MediaPicker from "@/components/admin/MediaPicker";

// Éditeur WYSIWYG utilisé aussi pour les Pages
const RichTextEditor = dynamic(() => import("@/components/admin/RichTextEditor"), {
  ssr: false,
});

type MediaAsset = {
  id: number;
  url: string;
  filename?: string | null;
  alt?: string | null;
};

type BrandFormProps = {
  initial?: {
    id?: number;
    name?: string;
    slug?: string;
    websiteUrl?: string | null;

    // Fallback URLs
    logoUrl?: string | null;
    bannerUrl?: string | null;

    // HTML
    description?: string | null;

    active?: boolean;

    // SEO
    metaTitle?: string | null;
    metaDescription?: string | null;

    // Assets (pour preview)
    logoAsset?: MediaAsset | null;
    bannerAsset?: MediaAsset | null;
  };
  onSubmit: (formData: FormData) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export default function BrandForm({ initial, onSubmit, onDelete }: BrandFormProps) {
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      setPending(true);
      await onSubmit(form);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-1">
        <label className="text-sm">Nom *</label>
        <input name="name" required defaultValue={initial?.name ?? ""} className="input" />
      </div>

      <div className="grid gap-1">
        <label className="text-sm">Slug (optionnel)</label>
        <input name="slug" defaultValue={initial?.slug ?? ""} className="input" />
        <p className="text-xs text-neutral-500">Laisser vide pour générer automatiquement.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Site web</label>
          <input name="websiteUrl" defaultValue={initial?.websiteUrl ?? ""} className="input" />
        </div>

        {/* ── Logo via médiathèque ─────────────────────── */}
        <div className="grid gap-1">
          <MediaPicker
            label="Logo (médiathèque)"
            nameId="logoAssetId"
            kind="brand-logo"
            folder="brands"
            accept="image/*"
            initial={initial?.logoAsset ?? null}
          />
          <p className="text-xs text-neutral-500">
            Vous pouvez aussi renseigner une URL externe ci-dessous (fallback).
          </p>
        </div>
      </div>

      {/* Fallback URL logo */}
      <div className="grid gap-1">
        <label className="text-sm">Logo URL (optionnel)</label>
        <input name="logoUrl" defaultValue={initial?.logoUrl ?? ""} className="input" />
      </div>

      {/* ── Bannière via médiathèque ───────────────────── */}
      <div className="grid gap-1">
        <MediaPicker
          label="Bannière (médiathèque)"
          nameId="bannerAssetId"
          kind="brand-banner"
          folder="brands"
          accept="image/*"
          initial={initial?.bannerAsset ?? null}
        />
        <p className="text-xs text-neutral-500">
          Astuce : une image large (ex: 1600×480) rend mieux en haut de page.
        </p>
      </div>

      {/* Fallback URL bannière */}
      <div className="grid gap-1">
        <label className="text-sm">Bannière URL (optionnel)</label>
        <input name="bannerUrl" defaultValue={initial?.bannerUrl ?? ""} className="input" />
      </div>

      {/* SEO */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1">
          <label className="text-sm">Meta title (SEO)</label>
          <input
            name="metaTitle"
            defaultValue={initial?.metaTitle ?? ""}
            className="input"
            placeholder="Ex: Rossignol — Prix, tests et offres"
          />
          <p className="text-xs text-neutral-500">Conseil : ~50–60 caractères.</p>
        </div>

        <div className="grid gap-1">
          <label className="text-sm">Meta description (SEO)</label>
          <textarea
            name="metaDescription"
            defaultValue={initial?.metaDescription ?? ""}
            className="input min-h-[44px]"
            placeholder="Ex: Comparez les prix Rossignol, consultez nos guides et trouvez le bon modèle."
          />
          <p className="text-xs text-neutral-500">Conseil : ~140–160 caractères.</p>
        </div>
      </div>

      {/* Description HTML */}
      <div className="grid gap-1">
        <label className="text-sm">Description</label>
        <RichTextEditor
          name="description"
          initialValue={initial?.description ?? ""}
          label="Description de la marque"
        />
        <p className="text-xs text-neutral-500">
          Le contenu est enregistré en HTML et automatiquement nettoyé côté serveur.
        </p>
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} />
        Actif
      </label>

      <div className="flex items-center gap-2">
        <button className="btn" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>

        {onDelete && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={async () => {
              if (confirm("Supprimer cette marque ?")) await onDelete();
            }}
          >
            Supprimer
          </button>
        )}
      </div>
    </form>
  );
}
