// src/app/admin/tests/partials/NewTestForm.tsx
"use client";

import { useState, FormEvent } from "react";
import dynamic from "next/dynamic";
import MediaPicker from "@/components/admin/MediaPicker";
import { createTest } from "@/app/actions/tests";

const RichTextEditor = dynamic(
  () => import("@/components/admin/RichTextEditor"),
  { ssr: false }
);

type Category = {
  id: number;
  label: string;
  slug: string;
  order: number;
};

type Props = {
  categories: Category[];
};

export default function NewTestForm({ categories }: Props) {
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
      const score =
        scoreRaw != null && String(scoreRaw).trim() !== ""
          ? Number(scoreRaw)
          : null;

      const bannerAssetIdRaw = fd.get("bannerAssetId");
      const bannerAssetId =
        bannerAssetIdRaw && String(bannerAssetIdRaw).trim() !== ""
          ? Number(bannerAssetIdRaw)
          : null;

      // Notes par catégorie (0..10)
      const ratings: { categoryId: number; score: number }[] = [];
      for (const cat of categories) {
        const enabled = fd.get(`rating_enabled_${cat.id}`);
        if (!enabled) continue;
        const scoreRaw = fd.get(`rating_${cat.id}`);
        if (!scoreRaw) continue;
        const s = Number(scoreRaw);
        if (!Number.isFinite(s)) continue;
        ratings.push({ categoryId: cat.id, score: s });
      }

      await createTest({
        productSlugOrId: String(fd.get("product") ?? ""),
        title: String(fd.get("title") ?? ""),
        excerpt: fd.get("excerpt")
          ? String(fd.get("excerpt"))
          : undefined,
        content: fd.get("content")
          ? String(fd.get("content"))
          : undefined,
        score,
        sourceName: String(fd.get("sourceName") ?? ""),
        sourceUrl: String(fd.get("sourceUrl") ?? ""),
        status:
          (fd.get("status") as
            | "PENDING"
            | "APPROVED"
            | "REJECTED"
            | null) ?? "PENDING",
        bannerUrl: fd.get("bannerUrl")
          ? String(fd.get("bannerUrl"))
          : undefined,
        bannerAssetId:
          bannerAssetId && Number.isFinite(bannerAssetId)
            ? bannerAssetId
            : null,
        ratings,
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
    <form onSubmit={onSubmit} className="grid gap-4">
      {/* Produit lié */}
      <div className="grid gap-1">
        <label className="text-sm font-medium">
          Produit (slug ou ID) *
        </label>
        <input
          name="product"
          required
          className="input"
          placeholder="ex: salomon-qst-98-2025-26 ou 123"
        />
        <p className="text-xs text-neutral-500">
          Le test ne peut être créé que si le produit existe déjà.
        </p>
      </div>

      {/* Titre + extrait */}
      <div className="grid gap-1">
        <label className="text-sm font-medium">Titre *</label>
        <input name="title" required className="input" />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">Introduction</label>
        <textarea
          name="excerpt"
          rows={3}
          className="input"
          placeholder="Court paragraphe d’introduction du test…"
        />
      </div>

      {/* Bannière */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="grid gap-1">
          <MediaPicker
            label="Bannière (médiathèque)"
            nameId="bannerAssetId"
            kind="test-banner"
            folder="tests"
            accept="image/*"
            initial={null}
          />
          <p className="text-xs text-neutral-500">
            Image d’en-tête du test (optionnelle).
          </p>
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">
            Bannière URL (optionnel)
          </label>
          <input
            name="bannerUrl"
            className="input"
            placeholder="https://…"
          />
          <p className="text-xs text-neutral-500">
            Fallback si la bannière ne vient pas de la médiathèque.
          </p>
        </div>
      </div>

      {/* Contenu WYSIWYG */}
      <div className="grid gap-1">
        <label className="text-sm font-medium">Contenu complet</label>
        <RichTextEditor
          name="content"
          initialValue=""
          label="Contenu du test"
        />
        <p className="text-xs text-neutral-500">
          Contenu HTML enregistré et nettoyé côté serveur.
        </p>
      </div>

      {/* Score global + statut */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="grid gap-1">
          <label className="text-sm font-medium">
            Note globale (optionnel)
          </label>
          <input
            type="number"
            step="0.1"
            min={0}
            max={10}
            name="score"
            className="input"
            placeholder="ex: 8.5"
          />
          <p className="text-xs text-neutral-500">
            Note globale sur 10 (facultative).
          </p>
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">Statut</label>
          <select
            name="status"
            className="input"
            defaultValue="PENDING"
          >
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Source */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="grid gap-1">
          <label className="text-sm font-medium">
            Source (nom) *
          </label>
          <input
            name="sourceName"
            required
            className="input"
            placeholder="Meilleur-Ski, Skipass…"
          />
        </div>
        <div className="grid gap-1">
          <label className="text-sm font-medium">
            Source (URL) *
          </label>
          <input
            type="url"
            name="sourceUrl"
            required
            className="input"
            placeholder="https://…"
          />
        </div>
      </div>

      {/* Notes par catégorie */}
      <div className="grid gap-2 rounded-2xl border p-4 bg-surface/60">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Notes par catégorie (sur 10)
          </h3>
          <p className="text-xs text-neutral-500">
            Coche les catégories que tu veux utiliser pour ce test.
          </p>
        </div>
        {categories.length === 0 ? (
          <p className="text-xs text-neutral-500">
            Aucune catégorie de notation définie. Tu pourras en créer
            depuis le backoffice dédié.
          </p>
        ) : (
          <div className="grid gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border px-3 py-2"
              >
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name={`rating_enabled_${cat.id}`}
                  />
                  <span>{cat.label}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name={`rating_${cat.id}`}
                    min={0}
                    max={10}
                    step={0.5}
                    className="w-24 rounded border px-2 py-1 text-sm"
                    placeholder="0–10"
                  />
                  <span className="text-xs text-neutral-500">
                    / 10
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
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
