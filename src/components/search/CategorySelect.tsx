"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type CategoryItem = {
  slug: string;
  name: string;
  level: number; // 0 parent, 1 enfant, 2 petite-fille...
};

type Props = {
  name?: string; // default "category"
  items: CategoryItem[];
  defaultValue?: string; // slug
  placeholder?: string; // label affiché quand vide
};

export default function CategorySelect({
  name = "category",
  items,
  defaultValue = "",
  placeholder = "Toutes catégories",
}: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => setValue(defaultValue), [defaultValue]);

  // fermeture au clic extérieur
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const selectedLabel = useMemo(() => {
    if (!value) return placeholder;
    const found = items.find((x) => x.slug === value);
    return found?.name ?? placeholder;
  }, [value, items, placeholder]);

  const fontByLevel = (lvl: number) => {
    if (lvl <= 0) return "text-sm font-medium";
    if (lvl === 1) return "text-[13px] text-neutral-700";
    return "text-[12px] text-neutral-600";
  };

  const padByLevel = (lvl: number) => {
    if (lvl <= 0) return "";
    if (lvl === 1) return "pl-4";
    return "pl-7";
  };

  return (
    <div ref={boxRef} className="relative">
      {/* valeur envoyée au GET */}
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border px-3 py-2 text-left bg-white flex items-center justify-between gap-2"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${value ? "text-neutral-900" : "text-neutral-500"}`}>
          {selectedLabel}
        </span>
        <span className="text-neutral-500">▾</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border bg-white shadow-lg overflow-hidden">
          <ul role="listbox" className="max-h-72 overflow-auto">
            <li>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50"
                onClick={() => {
                  setValue("");
                  setOpen(false);
                }}
              >
                Toutes catégories
              </button>
            </li>

            <li className="h-px bg-neutral-200" />

            {items.map((it) => {
              const active = it.slug === value;
              return (
                <li key={it.slug}>
                  <button
                    type="button"
                    className={`w-full text-left px-3 py-2 hover:bg-neutral-50 ${
                      active ? "bg-neutral-50" : ""
                    }`}
                    onClick={() => {
                      setValue(it.slug);
                      setOpen(false);
                    }}
                  >
                    <div className={`${padByLevel(it.level)} ${fontByLevel(it.level)} leading-snug`}>
                      {it.level > 0 ? <span className="text-neutral-400 mr-2">—</span> : null}
                      {it.name}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}