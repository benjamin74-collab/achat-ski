"use client";

import { useState, FormEvent } from "react";
import { createReview } from "@/app/actions/reviews";

export default function NewReviewForm() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOk(null); setErr(null); setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await createReview({
        productSlugOrId: String(fd.get("product")),
        rating: Number(fd.get("rating")),
        title: String(fd.get("title")),
        body: String(fd.get("body") || ""),
        authorName: String(fd.get("authorName") || ""),
        sourceName: String(fd.get("sourceName") || ""),
        sourceUrl: String(fd.get("sourceUrl") || ""),
        status: (fd.get("status") as any) || "PENDING",
      });
      form.reset();
      setOk("Avis créé !");
    } catch (e: any) {
      setErr(e?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid gap-1">
        <label className="text-sm">Produit (slug ou id)</label>
        <input name="product" required className="rounded-xl border border-ring px-3 py-2" placeholder="ex: salomon-qst-98-2025-26" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Note (1..5)</label>
          <input type="number" name="rating" min={1} max={5} defaultValue={5} required className="rounded-xl border border-ring px-3 py-2" />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">Statut</label>
          <select name="status" className="rounded-xl border border-ring px-3 py-2">
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      <div className="grid gap-1">
        <label className="text-sm">Titre</label>
        <input name="title" required className="rounded-xl border border-ring px-3 py-2" />
      </div>

      <div className="grid gap-1">
        <label className="text-sm">Contenu</label>
        <textarea name="body" rows={4} className="rounded-xl border border-ring px-3 py-2" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="grid gap-1">
          <label className="text-sm">Auteur (visuel)</label>
          <input name="authorName" className="rounded-xl border border-ring px-3 py-2" />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">Source (nom)</label>
          <input name="sourceName" className="rounded-xl border border-ring px-3 py-2" />
        </div>
        <div className="grid gap-1">
          <label className="text-sm">Source (URL)</label>
          <input name="sourceUrl" className="rounded-xl border border-ring px-3 py-2" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Envoi..." : "Créer l’avis"}
        </button>
        {ok && <span className="text-sm text-green-600">{ok}</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>
    </form>
  );
}
