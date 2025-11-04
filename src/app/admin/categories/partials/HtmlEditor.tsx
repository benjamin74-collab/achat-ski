// src/app/admin/categories/partials/HtmlEditor.tsx
"use client";

import { useState, useId, useMemo } from "react";
import { sanitizeHtml } from "../../../../lib/sanitize";

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

  // Aperçu sanitisé (memo pour éviter de recalculer à chaque render)
  const sanitized = useMemo(() => (value ? sanitizeHtml(value) : ""), [value]);

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm">{label}</label>
        <span className="text-xs text-neutral-500">Collez votre HTML → aperçu à droite</span>
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

      {/* champ réel soumis au formulaire (on stocke la valeur brute ; la sanitation est faite pour l'affichage et devra aussi être refaite côté serveur à la sauvegarde/avant rendu) */}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
