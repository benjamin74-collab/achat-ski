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

  // Sync initialValue -> états visuel + HTML
  useEffect(() => {
    setHtml(initialValue || "");
    if (visualRef.current) {
      visualRef.current.innerHTML = initialValue || "";
    }
    if (textareaRef.current) {
      textareaRef.current.value = initialValue || "";
    }
  }, [initialValue]);

  // Quand l’utilisateur tape dans le mode HTML
  const handleHtmlChange = useCallback((e: FormEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value;
    setHtml(value);
    if (visualRef.current) {
      visualRef.current.innerHTML = value;
    }
  }, []);

  // Quand l’utilisateur tape dans l’éditeur visuel
  const handleVisualInput = useCallback(() => {
    if (visualRef.current) {
      const value = visualRef.current.innerHTML;
      setHtml(value);
      if (textareaRef.current) {
        textareaRef.current.value = value;
      }
    }
  }, []);

  // Utilitaire: vérifier que la sélection est bien dans l’éditeur
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

  // Boutons de style inline (gras, italique, listes…) via execCommand
  const applyInlineCommand = useCallback(
    (command: string, value?: string) => {
      if (mode !== "visual") return;
      const ctx = getSelectionInEditor();
      if (!ctx) return;

      // execCommand est déprécié mais reste le plus simple sur du contentEditable
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

  // ✅ Bloque sur la sélection seulement (H2/H3/H4/Paragraphe)
  const applyBlock = useCallback(
    (block: "p" | "h2" | "h3" | "h4") => {
      if (mode !== "visual") return;
      const ctx = getSelectionInEditor();
      if (!ctx) return;

      // Dans la pratique, Next + contentEditable continuent de supporter execCommand/formatBlock
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

  // Inserer image <img> dans le HTML
  const insertImage = useCallback(() => {
    if (mode !== "visual") return;
    const url = window.prompt("URL de l’image");
    if (!url) return;

    const ctx = getSelectionInEditor();
    if (!ctx) return;

    const imgHtml = `<img src="${url}" alt="" />`;
    document.execCommand("insertHTML", false, imgHtml);

    if (visualRef.current) {
      const newHtml = visualRef.current.innerHTML;
      setHtml(newHtml);
      if (textareaRef.current) {
        textareaRef.current.value = newHtml;
      }
    }
  }, [mode, getSelectionInEditor]);

  // Inserer vidéo (iframe ou balise video) via HTML
  const insertVideo = useCallback(() => {
    if (mode !== "visual") return;
    const url = window.prompt("URL de la vidéo (YouTube, etc.)");
    if (!url) return;

    const ctx = getSelectionInEditor();
    if (!ctx) return;

    const iframeHtml = `<iframe src="${url}" frameborder="0" allowfullscreen></iframe>`;
    document.execCommand("insertHTML", false, iframeHtml);

    if (visualRef.current) {
      const newHtml = visualRef.current.innerHTML;
      setHtml(newHtml);
      if (textareaRef.current) {
        textareaRef.current.value = newHtml;
      }
    }
  }, [mode, getSelectionInEditor]);

  const btnBase =
    "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-brand-50 hover:border-brand-500 hover:text-brand-700 hover:shadow-sm transition-colors transition-transform duration-150 active:scale-95";

  const isVisual = mode === "visual";

  return (
    <div className="space-y-2">
      {label ? (
        <label className="text-sm font-medium text-slate-700">{label}</label>
      ) : null}

      {/* Barre d’outils */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        {/* Style de texte */}
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className={btnBase}
            onClick={() => applyInlineCommand("bold")}
          >
            <span className="font-semibold">Gras</span>
          </button>
          <button
            type="button"
            className={btnBase}
            onClick={() => applyInlineCommand("italic")}
          >
            <span className="italic">Italique</span>
          </button>
          <button
            type="button"
            className={btnBase}
            onClick={() => applyInlineCommand("insertUnorderedList")}
          >
            Puces
          </button>
          <button
            type="button"
            className={btnBase}
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
            className={btnBase}
            onClick={() => applyBlock("p")}
          >
            Paragraphe
          </button>
          <button
            type="button"
            className={btnBase}
            onClick={() => applyBlock("h2")}
          >
            H2
          </button>
          <button
            type="button"
            className={btnBase}
            onClick={() => applyBlock("h3")}
          >
            H3
          </button>
          <button
            type="button"
            className={btnBase}
            onClick={() => applyBlock("h4")}
          >
            H4
          </button>
        </div>

        <span className="h-6 w-px bg-slate-200" />

        {/* Médias */}
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className={btnBase}
            onClick={insertImage}
          >
            Image (URL)
          </button>
          <button
            type="button"
            className={btnBase}
            onClick={insertVideo}
          >
            Vidéo (URL)
          </button>
        </div>

        <span className="h-6 w-px bg-slate-200" />

        {/* Toggle mode */}
        <div className="ml-auto flex gap-1 rounded-lg bg-white p-1">
          <button
            type="button"
            className={
              btnBase +
              " px-3 py-1 text-[11px] " +
              (isVisual ? "bg-brand-600 text-white hover:bg-brand-600 hover:text-white" : "")
            }
            onClick={() => setMode("visual")}
          >
            Éditeur visuel
          </button>
          <button
            type="button"
            className={
              btnBase +
              " px-3 py-1 text-[11px] " +
              (!isVisual ? "bg-brand-600 text-white hover:bg-brand-600 hover:text-white" : "")
            }
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
      <textarea
        name={name}
        value={html}
        readOnly
        hidden
      />
    </div>
  );
}
