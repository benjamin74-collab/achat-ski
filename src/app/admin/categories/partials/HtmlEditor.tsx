// src/app/admin/categories/partials/HtmlEditor.tsx
"use client";

import { useState, useId } from "react";
import DOMPurify from "isomorphic-dompurify";

type Props = {
  name?: string;            // name du champ soumis dans le <form> (hidden)
  initialValue?: string;    // HTML initial (pour édition)
  label?: string;
  rows?: number;
  placeholder?: string;
};

export default function HtmlEditor({
  name = "content",
  initialValue = "",
  label = "Contenu (HTML)",
  rows = 10,
  placeholder = "<h2>Mon titre</h2>\n<p>Mon paragraphe…</p>",
}: Props) {
  const [value, setValue] = useState<string>(initialValue);
  const id = useId();
  const sanitized = value ? DOMPurify.sanitize(value) : "";

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm">{label}</label>
        <span className="text-xs text-neutral-500">Coller votre HTML → aperçu à droite</span>
      </div>

      {/* zone d'édition */}
      <div className="grid md:grid-cols-2 gap-3">
        <textarea
          id={id}
          className="rounded-xl border border-ring px-3 py-2 font-mono text-sm min-h-[200px]"
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        {/* aperçu sanitisé */}
        <div className="rounded-xl border border-ring p-3 bg-surface/60 prose max-w-none overflow-auto">
          {sanitized ? (
            <article dangerouslySetInnerHTML={{ __html: sanitized }} />
          ) : (
            <div className="text-sm text-neutral-500">Aperçu du contenu</div>
          )}
        </div>
      </div>

      {/* champ réel soumis au formulaire */}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
