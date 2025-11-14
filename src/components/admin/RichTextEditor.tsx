// src/components/admin/RichTextEditor.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  label?: string;
  initialValue?: string;
};

type Mode = "wysiwyg" | "html";

export default function RichTextEditor({
  name,
  label = "Contenu",
  initialValue = "",
}: Props) {
  const [mode, setMode] = useState<Mode>("wysiwyg");
  const [html, setHtml] = useState<string>(initialValue);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Hydrate le WYSIWYG quand on revient du mode HTML
  useEffect(() => {
    if (mode === "wysiwyg" && editorRef.current) {
      editorRef.current.innerHTML = html || "";
    }
  }, [mode, html]);

  // Sync textarea cachée (pour submit)
  useEffect(() => {
    if (textareaRef.current) textareaRef.current.value = html;
  }, [html]);

  const exec = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    if (editorRef.current) setHtml(editorRef.current.innerHTML);
  }, []);

  const applyHeading = useCallback((tag: "H2" | "H3") => {
    document.execCommand("formatBlock", false, tag);
    if (editorRef.current) setHtml(editorRef.current.innerHTML);
  }, []);

  const makeLink = useCallback(() => {
    const url = prompt("URL du lien :");
    if (!url) return;
    exec("createLink", url);
  }, [exec]);

  const insertImage = useCallback(() => {
    const url = prompt("URL de l’image (https://…) :");
    if (!url) return;
    const alt = prompt("Texte alternatif (alt) :") ?? "";
    const snippet = `<img src="${url}" alt="${alt.replace(/"/g, "&quot;")}" />`;
    document.execCommand("insertHTML", false, snippet);
    if (editorRef.current) setHtml(editorRef.current.innerHTML);
  }, []);

  const insertVideo = useCallback(() => {
    const htmlEmbed = prompt(
      "Code d’intégration vidéo (iframe ou balise <video>) :"
    );
    if (!htmlEmbed) return;
    document.execCommand("insertHTML", false, htmlEmbed);
    if (editorRef.current) setHtml(editorRef.current.innerHTML);
  }, []);

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "wysiwyg" ? "html" : "wysiwyg"));
  }, []);

  const toolbarBtn =
    "inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50";
  const groupClass = "flex items-center gap-1";
  const sep = <div className="w-px h-6 bg-slate-200 mx-1" />;

  return (
    <div className="grid gap-2 w-full">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <button
          type="button"
          onClick={toggleMode}
          className="btn-outline btn-sm"
          title={
            mode === "wysiwyg"
              ? "Basculer en vue HTML"
              : "Revenir à l’éditeur visuel"
          }
        >
          {mode === "wysiwyg" ? "Voir HTML" : "Éditeur visuel"}
        </button>
      </div>

      {mode === "wysiwyg" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 flex flex-wrap items-center gap-2 w-full">
          <div className={groupClass}>
            <button
              type="button"
              className={toolbarBtn}
              onClick={() => applyHeading("H2")}
              title="Titre H2"
            >
              H2
            </button>
            <button
              type="button"
              className={toolbarBtn}
              onClick={() => applyHeading("H3")}
              title="Titre H3"
            >
              H3
            </button>
          </div>

          {sep}

          <div className={groupClass}>
            <button
              type="button"
              className={toolbarBtn}
              onClick={() => exec("bold")}
              title="Gras (Ctrl/Cmd+B)"
            >
              <span className="font-bold">Gras</span>
            </button>
            <button
              type="button"
              className={toolbarBtn}
              onClick={() => exec("italic")}
              title="Italique (Ctrl/Cmd+I)"
            >
              <span className="italic">Italique</span>
            </button>
            <button
              type="button"
              className={toolbarBtn}
              onClick={() => exec("underline")}
              title="Souligné (Ctrl/Cmd+U)"
            >
              <span className="underline">Souligné</span>
            </button>
            <button
              type="button"
              className={toolbarBtn}
              onClick={() => exec("removeFormat")}
              title="Retirer la mise en forme"
            >
              Clear
            </button>
          </div>

          {sep}

          <div className={groupClass}>
            <button
              type="button"
              className={toolbarBtn}
              onClick={() => exec("insertUnorderedList")}
              title="Liste à puces"
            >
              • Liste
            </button>
            <button
              type="button"
              className={toolbarBtn}
              onClick={() => exec("insertOrderedList")}
              title="Liste numérotée"
            >
              1. Liste
            </button>
          </div>

          {sep}

          <div className={groupClass}>
            <button
              type="button"
              className={toolbarBtn}
              onClick={makeLink}
              title="Insérer un lien"
            >
              Lien
            </button>
            <button
              type="button"
              className={toolbarBtn}
              onClick={insertImage}
              title="Insérer une image (URL)"
            >
              Image
            </button>
            <button
              type="button"
              className={toolbarBtn}
              onClick={insertVideo}
              title="Insérer une vidéo (embed)"
            >
              Vidéo
            </button>
          </div>

          {sep}

          <div className={groupClass}>
            <button
              type="button"
              className={toolbarBtn}
              onClick={() => exec("undo")}
              title="Annuler"
            >
              ↶ Annuler
            </button>
            <button
              type="button"
              className={toolbarBtn}
              onClick={() => exec("redo")}
              title="Rétablir"
            >
              ↷ Rétablir
            </button>
          </div>
        </div>
      )}

      {mode === "wysiwyg" ? (
        <div
          ref={editorRef}
          className="prose w-full max-w-full min-h-[320px] rounded-xl border border-slate-200 bg-white p-4 focus:outline-none"
          contentEditable
          suppressContentEditableWarning
          onInput={(e) =>
            setHtml((e.currentTarget as HTMLDivElement).innerHTML)
          }
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <textarea
          className="input w-full min-h-[320px] font-mono text-xs"
          value={html}
          onChange={(e) => setHtml(e.currentTarget.value)}
        />
      )}

      {/* champ réel pour le form submit */}
      <textarea
        ref={textareaRef}
        name={name}
        defaultValue={initialValue}
        className="hidden"
      />
    </div>
  );
}
