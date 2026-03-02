// src/app/admin/cookies/CookieForm.tsx
"use client";

import { useState } from "react";

type Purpose = "ESSENTIAL" | "ANALYTICS" | "ADS" | "PERSONALIZATION";

export default function CookieForm({
  initial,
  onSubmit,
  onDelete,
}: {
  initial?: {
    siteId: string | null;
    key: string;
    name: string;
    provider: string | null;
    purpose: Purpose;
    description: string | null;
    durationDays: number | null;
    mandatory: boolean;
  };
  onSubmit: (fd: FormData) => void;
  onDelete?: () => void;
}) {
  const [mandatory, setMandatory] = useState(initial?.mandatory ?? false);

  return (
    <form action={onSubmit} className="grid gap-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Site (optionnel)</label>
          <input
            name="siteId"
            defaultValue={initial?.siteId ?? ""}
            placeholder='ex: "meilleur-ski" (vide = tous sites)'
            className="mt-1 w-full rounded-xl border px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Finalité</label>
          <select name="purpose" defaultValue={initial?.purpose ?? "ESSENTIAL"} className="mt-1 w-full rounded-xl border px-3 py-2">
            <option value="ESSENTIAL">Essentiel</option>
            <option value="ANALYTICS">Mesure d’audience</option>
            <option value="PERSONALIZATION">Personnalisation</option>
            <option value="ADS">Publicité</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Clé cookie</label>
          <input name="key" defaultValue={initial?.key ?? ""} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="_ga" required />
        </div>
        <div>
          <label className="text-sm font-medium">Nom (lisible)</label>
          <input name="name" defaultValue={initial?.name ?? ""} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="Google Analytics" required />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Fournisseur</label>
          <input name="provider" defaultValue={initial?.provider ?? ""} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="Google" />
        </div>

        <div>
          <label className="text-sm font-medium">Durée (jours)</label>
          <input
            name="durationDays"
            type="number"
            min={0}
            defaultValue={initial?.durationDays ?? ""}
            className="mt-1 w-full rounded-xl border px-3 py-2"
            placeholder="395"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          name="description"
          defaultValue={initial?.description ?? ""}
          className="mt-1 w-full rounded-xl border px-3 py-2 min-h-[90px]"
          placeholder="Pourquoi ce cookie est utilisé ?"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="mandatory"
          value="1"
          checked={mandatory}
          onChange={(e) => setMandatory(e.target.checked)}
        />
        Obligatoire au bon fonctionnement
      </label>

      <div className="flex items-center gap-2">
        <button className="btn">Enregistrer</button>
        {onDelete ? (
          <button type="button" onClick={onDelete} className="btn btn-ghost">
            Supprimer
          </button>
        ) : null}
      </div>
    </form>
  );
}