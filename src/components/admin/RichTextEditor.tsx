"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Mode = "visual" | "html";

type Props = {
  name: string;                 // ex: "content"
  label?: string;               // ex: "Contenu"
  initialValue?: string;        // HTML initial
  rows?: number;
};

function sanitizePastedHtml(html: string): string {
  // Filtre hyper simple (tu as déjà un sanitize côté serveur)
  // Ici on garde le HTML tel quel pour conserver le style auteur.
  return html;
}

export default function RichTextEditor({
  name,
  label = "Contenu",
  initialValue = "",
  rows = 16,
}: Props) {
  const [mode, setMode] = useState<Mode>("visual");
  const [html, setHtml] = useState<string>(initialValue);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const htmlRef = useRef<HTMLTextAreaElement>(null);

  // sync hidden input à chaque modif
  useEffect(() => {
    if (hiddenRef.current) hiddenRef.current.value = html;
  }, [html]);

  // commandes “rich text” (execCommand marche encore dans la majorité des navigateurs)
  const exec = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    // récupère le HTML actualisé
    if (visualRef.current) setHtml(visualRef.current.innerHTML);
  }, []);

  const onPaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    if (mode !== "visual") return;
    // colle proprement du HTML si présent, sinon texte
    const htmlData = e.clipboardData.getData("text/html");
    const textData = e.clipboardData.getData("text/plain");
    if (htmlData) {
      e.preventDefault();
      const clean = sanitizePastedHtml(htmlData);
      document.execCommand("insertHTML", false, clean);
      if (visualRef.current) setHtml(visualRef.current.innerHTML);
    } else if (textData) {
      e.preventDefault();
      document.execCommand("insertText", false, textData);
      if (visualRef.current) setHtml(visualRef.current.innerHTML);
    }
  }, [mode]);

  const toolbar = useMemo(
    () => (
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => exec("bold")} className="rt-btn">B</button>
        <button type="button" onClick={() => exec("italic")} className="rt-btn"><em>I</em></button>
        <button type="button" onClick={() => exec("formatBlock", "<h2>")} className="rt-btn">H2</button>
        <button type="button" onClick={() => exec("formatBlock", "<h3>")} className="rt-btn">H3</button>
        <button type="button" onClick={() => exec("insertUnorderedList")} className="rt-btn">• Liste</button>
        <button type="button" onClick={() => exec("insertOrderedList")} className="rt-btn">1. Liste</button>
        <button type="button" onClick={() => exec("formatBlock", "<blockquote>")} className="rt-btn">❝</button>
        <button
          type="button"
          onClick={() => {
            const url = prompt("URL du lien :");
            if (url) exec("createLink", url);
          }}
          className="rt-btn"
        >
          Lien
        </button>
        <button type="button" onClick={() => exec("removeFormat")} className="rt-btn">Effacer style</button>
      </div>
    ),
    [exec]
  );

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">{label}</label>

      {/* Onglets */}
      <div className="inline-flex rounded-lg border border-ring bg-white overflow-hidden w-fit">
        <button
          type="button"
          onClick={() => setMode("visual")}
          className={`px-3 py-1.5 text-sm ${mode === "visual" ? "bg-brand-50 text-brand-700" : "hover:bg-muted"}`}
          aria-pressed={mode === "visual"}
        >
          Éditeur
        </button>
        <button
          type="button"
          onClick={() => setMode("html")}
          className={`px-3 py-1.5 text-sm ${mode === "html" ? "bg-brand-50 text-brand-700" : "hover:bg-muted"}`}
          aria-pressed={mode === "html"}
        >
          HTML
        </button>
      </div>

      {/* Barre d’outils */}
      {mode === "visual" && (
        <div className="rounded-lg border border-ring bg-white p-2">{toolbar}</div>
      )}

      {/* Zone d’édition */}
      {mode === "visual" ? (
        <div
          ref={visualRef}
          className="rt-editor"
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => setHtml((e.target as HTMLDivElement).innerHTML)}
          onPaste={onPaste}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <textarea
          ref={htmlRef}
          className="textarea"
          rows={rows}
          value={html}
          onChange={(e) => setHtml(e.target.value)}
        />
      )}

      {/* champ réel envoyé au serveur */}
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={initialValue} />
    </div>
  );
}
