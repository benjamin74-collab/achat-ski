"use client";

import { useState } from "react";

type BrandFormProps = {
  initial?: {
    id?: number;
    name?: string;
    slug?: string;
    websiteUrl?: string | null;
    logoUrl?: string | null;
    description?: string | null;
    active?: boolean;
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
        <div className="grid gap-1">
          <label className="text-sm">Logo URL</label>
          <input name="logoUrl" defaultValue={initial?.logoUrl ?? ""} className="input" />
        </div>
      </div>

      <div className="grid gap-1">
        <label className="text-sm">Description (HTML autorisé)</label>
        <textarea name="description" rows={6} defaultValue={initial?.description ?? ""} className="input font-mono" />
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} />
        Actif
      </label>

      <div className="flex items-center gap-2">
        <button className="btn" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
        {onDelete && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={async () => { if (confirm("Supprimer cette marque ?")) await onDelete(); }}
          >
            Supprimer
          </button>
        )}
      </div>
    </form>
  );
}
