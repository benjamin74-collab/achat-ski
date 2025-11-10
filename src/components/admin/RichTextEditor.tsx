// src/components/admin/RichTextEditor.tsx
"use client";

import { useEffect, useRef } from "react";

type Props = {
  name: string;
  label?: string;
  initialValue?: string;
  rows?: number; // sert à donner une hauteur mini
  onChangeHtml?: (html: string) => void;
};

type BlockTag = "P" | "H2" | "H3" | "BLOCKQUOTE";
type InlineCommand = "bold" | "italic" | "underline";
type ListCommand = "insertUnorderedList" | "insertOrderedList";

function exec(command: string, value?: string) {
  // execCommand est déprécié mais encore supporté et typé (commandId: string)
  document.execCommand(command, false, value ?? "");
}

function sanitizeHtml(html: string): string {
  // Nettoyage léger: supprime <script> et on évite on* attrs
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script").forEach((n) => n.remove());
  // Retire attributs on* (onclick, onload, etc.)
  doc.querySelectorAll<HTMLElement>("*").forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (attr.name.toLowerCase().startsWith("on")) {
        el.removeAttribute(attr.name);
      }
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
  const ref = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  // init valeur
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = initialValue;
    }
    if (hiddenRef.current) {
      hiddenRef.current.value = initialValue;
    }
  }, [initialValue]);

  // propager la valeur propre (sanitisée) vers le champ hidden + callback
  const syncValue = (html: string) => {
    const clean = sanitizeHtml(html);
    if (hiddenRef.current) hiddenRef.current.value = clean;
    if (onChangeHtml) onChangeHtml(clean);
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    syncValue((e.currentTarget as HTMLDivElement).innerHTML);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    // colle comme <p>texte</p> simple
    exec("insertHTML", text.replace(/\n/g, "<br/>"));
  };

  const applyInline = (cmd: InlineCommand) => exec(cmd);
  const applyList = (cmd: ListCommand) => exec(cmd);
  const applyBlock = (tag: BlockTag | "CLEAR") => {
    if (tag === "CLEAR") {
      // reviens en paragraphe normal
      exec("formatBlock", "P");
      return;
    }
    exec("formatBlock", tag);
  };

  const minHeight = `${Math.max(8, rows) * 1.25}rem`;

  return (
    <div className="grid gap-2">
      <label className="text-sm">{label}</label>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-outline btn-sm" onClick={() => applyInline("bold")}>
          <span className="font-semibold">B</span>
        </button>
        <button type="button" className="btn-outline btn-sm italic" onClick={() => applyInline("italic")}>
          I
        </button>
        <button type="button" className="btn-outline btn-sm underline" onClick={() => applyInline("underline")}>
          U
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <button type="button" className="btn-outline btn-sm" onClick={() => applyBlock("P")}>
          Paragraphe
        </button>
        <button type="button" className="btn-outline btn-sm" onClick={() => applyBlock("H2")}>
          H2
        </button>
        <button type="button" className="btn-outline btn-sm" onClick={() => applyBlock("H3")}>
          H3
        </button>
        <button type="button" className="btn-outline btn-sm" onClick={() => applyBlock("BLOCKQUOTE")}>
          Citation
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <button type="button" className="btn-outline btn-sm" onClick={() => applyList("insertUnorderedList")}>
          • Liste
        </button>
        <button type="button" className="btn-outline btn-sm" onClick={() => applyList("insertOrderedList")}>
          1. Liste
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <button type="button" className="btn-outline btn-sm" onClick={() => applyBlock("CLEAR")}>
          Effacer format
        </button>
      </div>

      {/* Zone éditable */}
      <div
        ref={ref}
        role="textbox"
        aria-multiline
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        className="input min-h-[8rem] prose max-w-none focus:outline-none"
        style={{ minHeight }}
      />

      {/* Champ hidden pour le <form> */}
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={initialValue} />
    </div>
  );
}
