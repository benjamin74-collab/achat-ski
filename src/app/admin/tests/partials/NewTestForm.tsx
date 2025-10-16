// src/app/admin/tests/partials/NewTestForm.tsx
"use client";

import { useState, FormEvent } from "react";
import { createTest } from "@/app/actions/tests";

export default function NewTestForm() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOk(null);
    setErr(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    try {
      const scoreRaw = fd.get("score");
      const score = scoreRaw != null && String(scoreRaw).trim() !== "" ? Number(scoreRaw) : null;

      await createTest({
        productSlugOrId: String(fd.get("product") ?? ""),
        title: String(fd.get("title") ?? ""),
        excerpt: fd.get("excerpt") ? String(fd.get("excerpt")) : undefined,
        score,
        sourceName: String(fd.get("sourceName") ?? ""),
        sourceUrl: String(fd.get("sourceUrl") ?? ""),
        status: (fd.get("status") as "PENDING" | "APPROVED" | "REJECTED" | null) ?? "PENDING",
      });

      (e.currentTarget as HTMLFormElement).reset();
      setOk("Test créé !");
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid gap-1">
        <label className="text-sm">Produit (slug ou id)</label>
        <input
          name="product"
          required
          className="rounded-xl border border-ring px-3 py-2"
          placeholder="ex: salomon-qst-98-2025-26"
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm">Titre</label>
        <input name="title" required className="rounded-xl border border-ring px-3 py-2" />
      </div>

      <div className="grid gap-1">
        <label className="text-sm">Extrait</label>
        <textarea name="excerpt" rows={3} className="rounded-xl border border-ring px-3 py-2" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Score (optionnel)</label>
          <input
            type="number"
            step="0.1"
            name="score"
            className="rounded-xl border border-ring px-3 py-2"
            placeholder="ex: 8.5"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">Statut</label>
          <select name="status" className="rounded-xl border border-ring px-3 py-2" defaultValue="PENDING">
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Source (nom)</label>
          <input name="sourceName" required className="rounded-xl border border-ring px-3 py-2" />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">Source (URL)</label>
          <input type="url" name="sourceUrl" required className="rounded-xl border border-ring px-3 py-2" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Envoi..." : "Créer le test"}
        </button>
        {ok && <span className="text-sm text-green-600">{ok}</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>
    </form>
  );
}
