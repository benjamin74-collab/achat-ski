// src/components/admin/RichTextEditor.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  label?: string;
  initialValue?: string;
  rows?: number; // hauteur mini
  onChangeHtml?: (html: string) => void;
};

type BlockTag = "P" | "H2" | "H3" | "BLOCKQUOTE";
type InlineCommand = "bold" | "italic" | "underline";
type ListCommand = "insertUnorderedList" | "insertOrderedList";

function exec(command: string, value?: string) {
  document.execCommand(command, false, value ?? "");
}

function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script").forEach((n) => n.remove());
  doc.querySelectorAll<HTMLElement>("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (attr.name.toLowerCase().startsWith("on")) el.removeAttribute(attr.name);
    });
  });
  return doc.body.innerHTML;
}

export default function RichTextEditor({
  name,
  label = "Contenu",
  initialValue = "",
  rows = 16,
  onChangeHtml,
}: Props) {
  const [mode, setMode] = useState<"wysiwyg" | "html">("wysiwyg");
  const refWysiwyg = useRef<HTMLDivElement>(null);
  const refHidden = useRef<HTMLInputElement>(null);
  const refSource = useRef<HTMLTextAreaElement>(null);

  const minHeight = `${Math.max(8, rows) * 1.25}rem`;

  // init
  useEffect(() => {
    if (refWysiwyg.current) refWysiwyg.current.innerHTML = initialValue;
    if (refHidden.current) refHidden.current.value = initialValue;
    if (refSource.current) refSource.current.value = initialValue;
  }, [initialValue]);

  const sync = (html: string) => {
    const clean = sanitizeHtml(html);
    if (refHidden.current) refHidden.current.value = clean;
    if (onChangeHtml) onChangeHtml(clean);
  };

  // WYSIWYG events
  const onInputWys = (e: React.FormEvent<HTMLDivElement>) => {
    const html = (e.currentTarget as HTMLDivElement).innerHTML;
    if (refSource.current && mode === "html") refSource.current.value = html;
    sync(html);
  };
  const onPasteWys = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain");
    if (html) exec("insertHTML", html);
  };

  // SOURCE events
  const onChangeSrc = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const html = e.currentTarget.value;
    if (refWysiwyg.current && mode === "wysiwyg") refWysiwyg.current.innerHTML = html;
    sync(html);
  };

  // Toggle mode
  const toggleMode = () => {
    if (mode === "wysiwyg") {
      const html = refWysiwyg.current?.innerHTML ?? "";
      if (refSource.current) refSource.current.value = html;
      setMode("html");
    } else {
      const html = refSource.current?.value ?? "";
      if (refWysiwyg.current) refWysiwyg.current.innerHTML = html;
      setMode("wysiwyg");
    }
  };

  const applyInline = (cmd: InlineCommand) => exec(cmd);
  const applyList = (cmd: ListCommand) => exec(cmd);
  const applyBlock = (tag: BlockTag | "CLEAR") => {
    if (tag === "CLEAR") exec("formatBlock", "P");
    else exec("formatBlock", tag);
  };

  // Toolbar button (désactivée en mode HTML)
  const tbBtn = (children: React.ReactNode, onClick: () => void, title?: string) => (
    <button
      type="button"
      className={`btn-outline btn-sm ${mode === "html" ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={() => mode === "wysiwyg" && onClick()}
      title={title}
      aria-disabled={mode === "html"}
    >
      {children}
    </button>
  );

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm">{label}</label>
        <button
          type="button"
          className={`btn-outline btn-xs ${mode === "html" ? "bg-amber-50 border-amber-200" : ""}`}
          onClick={toggleMode}
          title="Basculer WYSIWYG / HTML"
        >
          {mode === "html" ? "Mode WYSIWYG" : "Mode HTML"}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {tbBtn(<span className="font-semibold">B</span>, () => applyInline("bold"), "Gras")}
        {tbBtn(<span className="italic">I</span>, () => applyInline("italic"), "Italique")}
        {tbBtn(<span className="underline">U</span>, () => applyInline("underline"), "Souligné")}
        <div className="w-px h-5 bg-slate-200 mx-1" />
        {tbBtn("P", () => applyBlock("P"), "Paragraphe")}
        {tbBtn("H2", () => applyBlock("H2"), "Titre H2")}
        {tbBtn("H3", () => applyBlock("H3"), "Titre H3")}
        {tbBtn("❝", () => applyBlock("BLOCKQUOTE"), "Citation")}
        <div className="w-px h-5 bg-slate-200 mx-1" />
        {tbBtn("• Liste", () => applyList("insertUnorderedList"), "Liste à puces")}
        {tbBtn("1. Liste", () => applyList("insertOrderedList"), "Liste numérotée")}
        <div className="w-px h-5 bg-slate-200 mx-1" />
        {tbBtn("Effacer format", () => applyBlock("CLEAR"), "Effacer le format")}
      </div>

      {/* Zones d’édition */}
      {mode === "wysiwyg" ? (
        <div
          ref={refWysiwyg}
          role="textbox"
          aria-multiline
          contentEditable
          suppressContentEditableWarning
          onInput={onInputWys}
          onPaste={onPasteWys}
          className="input min-h-[8rem] prose max-w-none focus:outline-none"
          style={{ minHeight }}
        />
      ) : (
        <textarea
          ref={refSource}
          className="input font-mono text-[13px]"
          style={{ minHeight }}
          defaultValue={initialValue}
          onChange={onChangeSrc}
        />
      )}

      {/* champ hidden pour le <form> */}
      <input ref={refHidden} type="hidden" name={name} defaultValue={initialValue} />
    </div>
  );
}
