// src/app/admin/tests/partials/NewTestForm.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
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

type ProductOption = {
  id: number;
  slug: string;
  label: string;
};

export default function NewTestForm({ categories }: Props) {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // 🔍 Recherche produit
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ProductOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);

  // Auto-complétion produits
  useEffect(() => {
    // moins de 2 caractères -> on ne cherche pas
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function run() {
      try {
        setSearching(true);
        setSearchError(null);

        const res = await fetch(
          `/api/admin/products/search?q=${encodeURIComponent(searchTerm.trim())}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          throw new Error("Erreur réseau");
        }

        const data = (await res.json()) as { items?: ProductOption[] };
        if (!cancelled) {
          setSearchResults(data.items ?? []);
        }
      } catch (e: any) {
        if (cancelled) return;
        if (e?.name === "AbortError") return;
        setSearchError("Erreur lors de la recherche de produits.");
        setSearchResults([]);
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [searchTerm]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOk(null);
    setErr(null);
    setLoading(true);

    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);

    try {
      if (!selectedProduct) {
        throw new Error("Merci de sélectionner un produit pour ce test.");
      }

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

      // URL de source facultative
      const rawSourceUrl = fd.get("sourceUrl");
      const sourceUrl =
        rawSourceUrl && String(rawSourceUrl).trim() !== ""
          ? String(rawSourceUrl).trim()
          : undefined;

      // Notes par catégorie (0..10)
      const ratings: { categoryId: number; score: number }[] = [];
      for (const cat of categories) {
        const enabled = fd.get(`rating_enabled_${cat.id}`);
        if (!enabled) continue;
        const scoreRawCat = fd.get(`rating_${cat.id}`);
        if (!scoreRawCat) continue;
        const s = Number(scoreRawCat);
        if (!Number.isFinite(s)) continue;
        ratings.push({ categoryId: cat.id, score: s });
      }

      await createTest({
        // ✅ liaison forte au produit via son ID
        productId: selectedProduct.id,
        // on envoie aussi le slug en secours (utile pour JSON-LD, etc.)
        productSlugOrId: selectedProduct.slug,
        title: String(fd.get("title") ?? ""),
        excerpt: fd.get("excerpt")
          ? String(fd.get("excerpt"))
          : undefined,
        content: fd.get("content")
          ? String(fd.get("content"))
          : undefined,
        score,
        sourceName: String(fd.get("sourceName") ?? ""),
        sourceUrl,
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

      // ✅ reset propre
      form.reset();
      setSelectedProduct(null);
      setSearchTerm("");
      setSearchResults([]);
      setOk("Test créé !");
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {/* Produit lié (recherche + sélection obligatoire) */}
      <div className="grid gap-1 relative">
        <label className="text-sm font-medium">
          Produit testé *
        </label>
        <input
          type="text"
          className="input"
          placeholder="Rechercher par marque, modèle, saison…"
          value={selectedProduct ? selectedProduct.label : searchTerm}
          onChange={(e) => {
            setSelectedProduct(null);
            setSearchTerm(e.target.value);
          }}
        />
        {searching && (
          <p className="mt-1 text-xs text-neutral-500">
            Recherche en cours…
          </p>
        )}
        {searchError && (
          <p className="mt-1 text-xs text-red-600">
            {searchError}
          </p>
        )}
        {!selectedProduct && searchTerm.trim().length >= 2 && searchResults.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border bg-white text-sm shadow-lg">
            {searchResults.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(p);
                    setSearchResults([]);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted"
                >
                  <span>{p.label}</span>
                  <span className="text-xs text-neutral-500">
                    #{p.id} · {p.slug}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedProduct && (
          <p className="mt-1 text-xs text-neutral-600">
            Produit sélectionné :{" "}
            <strong>{selectedProduct.label}</strong>{" "}
            (id {selectedProduct.id}, slug {selectedProduct.slug})
          </p>
        )}
        <p className="text-xs text-neutral-500">
          Tape au moins 2 caractères puis clique sur un produit dans la liste pour le lier au test.
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
            Source (URL)
          </label>
          <input
            type="url"
            name="sourceUrl"
            className="input"
            placeholder="https://…"
          />
          <p className="text-xs text-neutral-500">
            Facultatif pour les tests internes (Meilleur-Ski).
          </p>
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
