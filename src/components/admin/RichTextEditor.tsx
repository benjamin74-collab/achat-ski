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

type MediaKind = "image" | "video";

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

  // Popin média
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [mediaKind, setMediaKind] = useState<MediaKind>("image");
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  // ⚠️ IMPORTANT : on dépend SEULEMENT de `mode` pour ne pas casser la position du curseur
  useEffect(() => {
    if (mode === "visual" && visualRef.current) {
      visualRef.current.innerHTML = html || "";
    }
  }, [mode]); // <- pas de dépendance `html` ici

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

  // Insérer du HTML à la position du curseur
  const insertHtmlAtSelection = useCallback(
    (snippet: string) => {
      if (mode !== "visual") return;
      const ctx = getSelectionInEditor();
      if (!ctx) return;

      document.execCommand("insertHTML", false, snippet);

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

  // --- Gestion de la popin média ------------------------------------

  const openMediaDialog = useCallback(
    (kind: MediaKind) => {
      if (mode !== "visual") {
        setMode("visual");
      }
      setMediaKind(kind);
      setMediaUrlInput("");
      setShowMediaDialog(true);
    },
    [mode]
  );

  const closeMediaDialog = useCallback(() => {
    setShowMediaDialog(false);
    setMediaUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleMediaUrlInsert = useCallback(() => {
    if (!mediaUrlInput.trim()) return;
    if (mediaKind === "image") {
      insertHtmlAtSelection(`<img src="${mediaUrlInput.trim()}" alt="" />`);
    } else {
      insertHtmlAtSelection(
        `<iframe src="${mediaUrlInput.trim()}" frameborder="0" allowfullscreen></iframe>`
      );
    }
    closeMediaDialog();
  }, [mediaUrlInput, mediaKind, insertHtmlAtSelection, closeMediaDialog]);

  const handleMediaUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setMediaUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "pages/content");
        fd.append(
          "kind",
          mediaKind === "image" ? "page-image" : "page-video"
        );

        const res = await fetch("/api/admin/media/upload", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          throw new Error("Upload failed");
        }
        const json = await res.json();
        const asset = json.asset as {
          url: string;
          publicUrl?: string;
          alt?: string | null;
        };

        const url = asset.publicUrl || asset.url;
        if (mediaKind === "image") {
          insertHtmlAtSelection(
            `<img src="${url}" alt="${asset.alt ?? ""}" />`
          );
        } else {
          insertHtmlAtSelection(
            `<video src="${url}" controls style="max-width:100%;height:auto;"></video>`
          );
        }

        closeMediaDialog();
      } catch (err) {
        console.error(err);
        alert("Échec de l’upload");
      } finally {
        setMediaUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [mediaKind, insertHtmlAtSelection, closeMediaDialog]
  );

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

        {/* Médias : ouvrent la popin */}
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className={toolbarBtn}
            onClick={() => openMediaDialog("image")}
          >
            Image
          </button>
          <button
            type="button"
            className={toolbarBtn}
            onClick={() => openMediaDialog("video")}
          >
            Vidéo
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

      {/* Popin média */}
      {showMediaDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Insérer un média ({mediaKind === "image" ? "image" : "vidéo"})
              </h3>
              <button
                type="button"
                onClick={closeMediaDialog}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Fermer
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Upload direct */}
              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  Téléverser un fichier depuis votre ordinateur :
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={mediaKind === "image" ? "image/*" : "video/*"}
                  onChange={handleMediaUpload}
                  disabled={mediaUploading}
                />
                {mediaUploading && (
                  <p className="text-xs text-slate-500">
                    Upload en cours…
                  </p>
                )}
              </div>

              <div className="h-px w-full bg-slate-200" />

              {/* URL directe */}
              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  Ou insérer via une URL :
                </p>
                <input
                  className="input text-xs"
                  placeholder={
                    mediaKind === "image"
                      ? "https://…/mon-image.jpg"
                      : "https://…/ma-video-embed"
                  }
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleMediaUrlInsert}
                  className="btn-sm btn"
                >
                  Insérer ce média
                </button>
              </div>

              <div className="h-px w-full bg-slate-200" />

              {/* Lien vers médiathèque complète */}
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-600">
                  Besoin d’un média existant ?
                </p>
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={() =>
                    window.open("/admin/media", "_blank", "noopener,noreferrer")
                  }
                >
                  Ouvrir la médiathèque complète
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
