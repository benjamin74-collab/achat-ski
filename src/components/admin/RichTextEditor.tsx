// src/components/admin/RichTextEditor.tsx
"use client";

import { useState, useRef, useEffect } from "react";

type Mode = "visual" | "html";

type Props = {
  name: string;
  label?: string;
  initialValue?: string;
};

type MediaType = "image" | "video";

export default function RichTextEditor({
  name,
  label = "Contenu",
  initialValue = "",
}: Props) {
  const [mode, setMode] = useState<Mode>("visual");
  const [value, setValue] = useState<string>(initialValue);
  const editorRef = useRef<HTMLDivElement | null>(null);

  // Dialog média
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialisation du contenu visuel
  useEffect(() => {
    if (mode === "visual" && editorRef.current) {
      editorRef.current.innerHTML = value || "";
    }
  }, [mode, value]);

  function syncFromDom() {
    if (editorRef.current && mode === "visual") {
      setValue(editorRef.current.innerHTML);
    }
  }

  function applyCommand(command: string, arg?: string) {
    if (mode !== "visual") return;
    document.execCommand(command, false, arg);
    syncFromDom();
  }

  function toggleMode(next: Mode) {
    if (next === mode) return;
    if (next === "html") {
      // On repasse en HTML -> on sync depuis le DOM
      syncFromDom();
      setMode("html");
    } else {
      // On repasse en visuel
      setMode("visual");
    }
  }

  function openMediaDialog(type: MediaType) {
    setMediaType(type);
    setMediaUrlInput("");
    setShowMediaDialog(true);
  }

  function closeMediaDialog() {
    setShowMediaDialog(false);
    setMediaUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function insertMediaHtml(url: string) {
    if (!url) return;
    const htmlSnippet =
      mediaType === "image"
        ? `<img src="${url}" alt="" />`
        : `<video controls src="${url}" />`;

    if (mode === "visual") {
      // On insère à la position du curseur
      document.execCommand("insertHTML", false, htmlSnippet);
      syncFromDom();
    } else {
      setValue((prev) => `${prev}\n${htmlSnippet}`);
    }
  }

  async function handleMediaFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "pages/content");
      fd.append("kind", mediaType === "image" ? "page-image" : "page-video");

      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      const url: string = json.asset.url;
      insertMediaHtml(url);
      closeMediaDialog();
    } catch (err) {
      console.error(err);
      alert("Échec du téléversement du média");
    }
  }

  function handleInsertFromUrl() {
    if (!mediaUrlInput) return;
    insertMediaHtml(mediaUrlInput.trim());
    closeMediaDialog();
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => toggleMode("visual")}
            className={
              mode === "visual"
                ? "px-2 py-1 rounded-md bg-brand-500 text-white"
                : "px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }
          >
            Éditeur visuel
          </button>
          <button
            type="button"
            onClick={() => toggleMode("html")}
            className={
              mode === "html"
                ? "px-2 py-1 rounded-md bg-slate-800 text-white"
                : "px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }
          >
            Mode HTML
          </button>
        </div>
      </div>

      {/* Toolbar (masquée en mode HTML) */}
      {mode === "visual" && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700">
          <button
            type="button"
            onClick={() => applyCommand("bold")}
            className="px-2 py-1 rounded-md hover:bg-white"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => applyCommand("italic")}
            className="px-2 py-1 rounded-md hover:bg-white italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => applyCommand("insertUnorderedList")}
            className="px-2 py-1 rounded-md hover:bg-white"
          >
            • Liste
          </button>
          <button
            type="button"
            onClick={() => applyCommand("insertOrderedList")}
            className="px-2 py-1 rounded-md hover:bg-white"
          >
            1. Liste
          </button>
          <button
            type="button"
            onClick={() => applyCommand("formatBlock", "<h2>")}
            className="px-2 py-1 rounded-md hover:bg-white"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => applyCommand("formatBlock", "<h3>")}
            className="px-2 py-1 rounded-md hover:bg-white"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => {
              const url = window.prompt("URL du lien :");
              if (url) applyCommand("createLink", url);
            }}
            className="px-2 py-1 rounded-md hover:bg-white"
          >
            Lien
          </button>

          <span className="mx-2 h-4 w-px bg-slate-300" />

          <button
            type="button"
            onClick={() => openMediaDialog("image")}
            className="px-2 py-1 rounded-md hover:bg-white"
          >
            🖼️ Image
          </button>
          <button
            type="button"
            onClick={() => openMediaDialog("video")}
            className="px-2 py-1 rounded-md hover:bg-white"
          >
            🎬 Vidéo
          </button>
        </div>
      )}

      {/* Zone d’édition */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        {mode === "visual" ? (
          <div
            ref={editorRef}
            className="min-h-[260px] max-h-[600px] overflow-y-auto px-3 py-2 text-sm leading-relaxed focus:outline-none"
            contentEditable
            suppressContentEditableWarning
            onInput={syncFromDom}
          />
        ) : (
          <textarea
            className="input min-h-[260px] max-h-[600px] resize-y"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
      </div>

      {/* Champ hidden qui sera envoyé au backend */}
      <input type="hidden" name={name} value={value} />

      {/* Dialog insertion média */}
      {showMediaDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">
              Insérer une {mediaType === "image" ? "image" : "vidéo"}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Téléverse un fichier OU colle une URL (par exemple depuis la
              médiathèque).
            </p>

            <div className="grid gap-3">
              <div className="grid gap-1">
                <label className="text-xs font-medium text-slate-700">
                  Téléverser un fichier
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={mediaType === "image" ? "image/*" : "video/*"}
                  onChange={handleMediaFileChange}
                  className="text-xs"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-medium text-slate-700">
                  URL du média
                </label>
                <input
                  className="input text-xs"
                  placeholder="https://…"
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={() => window.open("/admin/media", "_blank")}
              >
                Ouvrir la médiathèque
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={closeMediaDialog}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={handleInsertFromUrl}
                  disabled={!mediaUrlInput.trim()}
                >
                  Insérer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
