// src/components/admin/RichTextEditor.tsx
"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  FormEvent,
} from "react";

type RichTextEditorProps = {
  name: string;
  initialValue?: string;
  label?: string;
  rows?: number;
};

type MediaAsset = {
  id: number;
  publicUrl: string;
  title: string | null;
  alt: string | null;
  slug?: string;        // ✅ ajouté pour matcher /api/media/list
  mime?: string;        // optionnel
  bytes?: number | null; // optionnel
};

export default function RichTextEditor({
  name,
  initialValue = "",
  label = "Contenu",
  rows = 16,
}: RichTextEditorProps) {
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [html, setHtml] = useState<string>(initialValue);
  const visualRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // --- État pour la modale d’image / médiathèque ---
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageTab, setImageTab] = useState<"url" | "library">("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);

  // 1) Sync initialValue -> état interne
  useEffect(() => {
    setHtml(initialValue || "");
    if (visualRef.current) {
      visualRef.current.innerHTML = initialValue || "";
    }
    if (textareaRef.current) {
      textareaRef.current.value = initialValue || "";
    }
  }, [initialValue]);

  // 2) Quand on repasse en mode visuel => injecter le HTML dans le contentEditable
  useEffect(() => {
    if (mode === "visual" && visualRef.current) {
      visualRef.current.innerHTML = html || "";
    }
  }, [mode, html]);

  // Édition du mode HTML
  const handleHtmlChange = useCallback((e: FormEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value;
    setHtml(value);
    if (visualRef.current) {
      visualRef.current.innerHTML = value;
    }
  }, []);

  // Édition du mode visuel
  const handleVisualInput = useCallback(() => {
    if (visualRef.current) {
      const value = visualRef.current.innerHTML;
      setHtml(value);
      if (textareaRef.current) {
        textareaRef.current.value = value;
      }
    }
  }, []);

  // Utilitaire : récupérer la sélection dans l’éditeur
  const getSelectionInEditor = useCallback(() => {
    if (typeof window === "undefined") return null;
    const root = visualRef.current;
    if (!root) return null;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;

    const range = sel.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) return null;

    return { sel, range, root };
  }, []);

  // Boutons inline (gras, italique, listes, etc.)
  const applyInlineCommand = useCallback(
    (command: string, value?: string) => {
      if (mode !== "visual") return;
      const ctx = getSelectionInEditor();
      if (!ctx) return;

      document.execCommand(command, false, value);

      if (visualRef.current) {
        const newHtml = visualRef.current.innerHTML;
        setHtml(newHtml);
        if (textareaRef.current) {
          textareaRef.current.value = newHtml;
        }
      }
    },
    [mode, getSelectionInEditor]
  );

  // H2 / H3 / H4 / paragraphe sur la sélection uniquement
  const applyBlock = useCallback(
    (block: "p" | "h2" | "h3" | "h4") => {
      if (mode !== "visual") return;
      const ctx = getSelectionInEditor();
      if (!ctx) return;

      const tag = block === "p" ? "p" : block.toUpperCase();
      document.execCommand("formatBlock", false, tag);

      if (visualRef.current) {
        const newHtml = visualRef.current.innerHTML;
        setHtml(newHtml);
        if (textareaRef.current) {
          textareaRef.current.value = newHtml;
        }
      }
    },
    [mode, getSelectionInEditor]
  );

  // --- Gestion modale Image + médiathèque ---

  const openImageModal = useCallback(() => {
    if (mode !== "visual") {
      setMode("visual");
    }
    setImageTab("url");
    setImageUrl("");
    setImageAlt("");
    setSelectedMediaId(null);
    setShowImageModal(true);
  }, [mode]);

  const closeImageModal = useCallback(() => {
    setShowImageModal(false);
  }, []);

  // Chargement médiathèque dans la modale
  const loadMediaAssets = useCallback(async () => {
    try {
      setMediaLoading(true);
      const res = await fetch("/api/media/list", { cache: "no-store" });
      const json = await res.json();
      setMediaAssets(json.assets || []);
    } catch (e) {
      console.error("Erreur chargement médiathèque", e);
    } finally {
      setMediaLoading(false);
    }
  }, []);

  // Passer à l’onglet médiathèque
  const handleTabLibrary = useCallback(() => {
    setImageTab("library");
    if (mediaAssets.length === 0) {
      void loadMediaAssets();
    }
  }, [loadMediaAssets, mediaAssets.length]);

  const handleTabUrl = useCallback(() => {
    setImageTab("url");
  }, []);

  const handleSelectMedia = useCallback((asset: MediaAsset) => {
    setSelectedMediaId(asset.id);
    setImageUrl(asset.publicUrl);
    setImageAlt(asset.alt || asset.title || "");
  }, []);

  // Insertion d’une image (depuis modal, URL ou médiathèque)
  const insertImageFromModal = useCallback(() => {
    if (!imageUrl) {
      alert("Merci de choisir une image ou de saisir une URL.");
      return;
    }

    if (!visualRef.current) {
      setShowImageModal(false);
      return;
    }

    const altAttr = imageAlt
      ? ` alt="${imageAlt.replace(/"/g, "&quot;")}"`
      : ` alt=""`;
    const imgHtml = `<img src="${imageUrl}"${altAttr} />`;

    // On tente d’insérer à la sélection si possible
    const ctx = getSelectionInEditor();
    if (ctx) {
      document.execCommand("insertHTML", false, imgHtml);
    } else {
      // Sinon on append à la fin
      visualRef.current.innerHTML =
        (visualRef.current.innerHTML || "") + imgHtml;
    }

    const newHtml = visualRef.current.innerHTML;
    setHtml(newHtml);
    if (textareaRef.current) {
      textareaRef.current.value = newHtml;
    }

    setShowImageModal(false);
  }, [imageUrl, imageAlt, getSelectionInEditor]);

  // Insérer une vidéo (URL iframe simple)
  const insertVideo = useCallback(() => {
    if (mode !== "visual") return;
    const url = window.prompt("URL de la vidéo (YouTube, etc.)");
    if (!url) return;

    const ctx = getSelectionInEditor();
    const iframeHtml = `<iframe src="${url}" frameborder="0" allowfullscreen></iframe>`;

    if (ctx) {
      document.execCommand("insertHTML", false, iframeHtml);
    } else if (visualRef.current) {
      visualRef.current.innerHTML =
        (visualRef.current.innerHTML || "") + iframeHtml;
    }

    if (visualRef.current) {
      const newHtml = visualRef.current.innerHTML;
      setHtml(newHtml);
      if (textareaRef.current) {
        textareaRef.current.value = newHtml;
      }
    }
  }, [mode, getSelectionInEditor]);

  // Base des boutons
  const btnBase =
    "inline-flex items-center justify-center rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium transition-colors transition-transform duration-150 hover:shadow-sm active:scale-95";

  const isVisual = mode === "visual";

  const visualBtnClass =
    btnBase +
    " px-3 py-1 text-[11px] " +
    (isVisual
      ? "bg-brand-600 text-white border-brand-600"
      : "bg-white text-slate-700 hover:bg-brand-50 hover:border-brand-500 hover:text-brand-700");

  const htmlBtnClass =
    btnBase +
    " px-3 py-1 text-[11px] " +
    (!isVisual
      ? "bg-brand-600 text-white border-brand-600"
      : "bg-white text-slate-700 hover:bg-brand-50 hover:border-brand-500 hover:text-brand-700");

  const toolbarBtn =
    btnBase +
    " bg-white text-slate-700 hover:bg-brand-50 hover:border-brand-500 hover:text-brand-700";

  return (
    <div className="space-y-2">
      {label ? (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      ) : null}

      {/* Barre d’outils */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        {/* Style inline */}
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className={toolbarBtn}
            onClick={() => applyInlineCommand("bold")}
          >
            <span className="font-semibold">Gras</span>
          </button>
          <button
            type="button"
            className={toolbarBtn}
            onClick={() => applyInlineCommand("italic")}
          >
            <span className="italic">Italique</span>
          </button>
          <button
            type="button"
            className={toolbarBtn}
            onClick={() => applyInlineCommand("insertUnorderedList")}
          >
            Puces
          </button>
          <button
            type="button"
            className={toolbarBtn}
            onClick={() => applyInlineCommand("insertOrderedList")}
          >
            Liste num.
          </button>
        </div>

        <span className="h-6 w-px bg-slate-200" />

        {/* Titres */}
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className={toolbarBtn}
            onClick={() => applyBlock("p")}
          >
            Paragraphe
          </button>
          <button
            type="button"
            className={toolbarBtn}
            onClick={() => applyBlock("h2")}
          >
            H2
          </button>
          <button
            type="button"
            className={toolbarBtn}
            onClick={() => applyBlock("h3")}
          >
            H3
          </button>
          <button
            type="button"
            className={toolbarBtn}
            onClick={() => applyBlock("h4")}
          >
            H4
          </button>
        </div>

        <span className="h-6 w-px bg-slate-200" />

        {/* Médias : modale pour Image, prompt pour Vidéo */}
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className={toolbarBtn}
            onClick={openImageModal}
          >
            Image
          </button>
          <button
            type="button"
            className={toolbarBtn}
            onClick={insertVideo}
          >
            Vidéo (URL)
          </button>
        </div>

        {/* Toggle mode à droite */}
        <div className="ml-auto flex gap-1 rounded-lg bg-white p-1">
          <button
            type="button"
            className={visualBtnClass}
            onClick={() => setMode("visual")}
          >
            Éditeur visuel
          </button>
          <button
            type="button"
            className={htmlBtnClass}
            onClick={() => setMode("html")}
          >
            Mode HTML
          </button>
        </div>
      </div>

      {/* Zone d’édition */}
      {mode === "visual" ? (
        <div
          ref={visualRef}
          className="editor-prose min-h-[260px] rounded-xl border border-slate-200 bg-white px-3 py-2 leading-relaxed focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-500/60"
          contentEditable
          suppressContentEditableWarning
          onInput={handleVisualInput}
        />
      ) : (
        <textarea
          ref={textareaRef}
          className="input font-mono text-xs"
          rows={rows}
          defaultValue={html}
          onInput={handleHtmlChange}
        />
      )}

      {/* Champ réel envoyé au serveur */}
      <textarea name={name} value={html} readOnly hidden />

      {/* Modale Image + Médiathèque */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-slate-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-800">
                Insérer une image
              </h2>
              <button
                type="button"
                onClick={closeImageModal}
                className="text-slate-500 hover:text-slate-700 text-sm"
              >
                Fermer
              </button>
            </div>

            {/* Onglets */}
            <div className="px-4 pt-3">
              <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs">
                <button
                  type="button"
                  onClick={handleTabUrl}
                  className={
                    "px-3 py-1 rounded-full " +
                    (imageTab === "url"
                      ? "bg-white shadow-sm text-brand-700"
                      : "text-slate-600 hover:text-slate-800")
                  }
                >
                  URL directe
                </button>
                <button
                  type="button"
                  onClick={handleTabLibrary}
                  className=
                    "px-3 py-1 rounded-full " +
                    (imageTab === "library"
                      ? "bg-white shadow-sm text-brand-700"
                      : "text-slate-600 hover:text-slate-800")
                  }
                >
                  Médiathèque
                </button>
              </div>
            </div>

            {/* Contenu de la modale */}
            <div className="px-4 pb-4 pt-3">
              {imageTab === "url" && (
                <div className="space-y-3">
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-slate-700">
                      URL de l&apos;image
                    </label>
                    <input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="input text-xs"
                      placeholder="https://…"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-slate-700">
                      Texte alternatif (SEO / accessibilité)
                    </label>
                    <input
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      className="input text-xs"
                      placeholder="Ex: Comparatif chaussures de ski 2025"
                    />
                  </div>
                </div>
              )}

              {imageTab === "library" && (
                <div className="space-y-3">
                  {mediaLoading ? (
                    <div className="text-xs text-slate-500">
                      Chargement de la médiathèque…
                    </div>
                  ) : mediaAssets.length === 0 ? (
                    <div className="text-xs text-slate-500">
                      Aucun média pour l&apos;instant. Téléversez une image
                      dans l&apos;onglet Médiathèque globale.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-72 overflow-auto">
                      {mediaAssets.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleSelectMedia(m)}
                          className={
                            "group relative rounded-xl border overflow-hidden " +
                            (selectedMediaId === m.id
                              ? "border-brand-500 ring-2 ring-brand-400"
                              : "border-slate-200 hover:border-brand-300")
                          }
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.publicUrl}
                            alt={m.alt || m.title || ""}
                            className="aspect-square w-full object-cover group-hover:scale-[1.02] transition-transform"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/40 px-2 py-1 text-[10px] text-white truncate">
                            {m.title || m.slug || `Image #${m.id}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pied de modale */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <div className="text-[11px] text-slate-500">
                Astuce : utilisez la médiathèque pour réutiliser des visuels
                optimisés.
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={closeImageModal}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={insertImageFromModal}
                >
                  Insérer l&apos;image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
