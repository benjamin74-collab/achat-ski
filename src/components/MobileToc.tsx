"use client";

import { useState } from "react";

type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

export default function MobileToc({ items }: { items: TocItem[] }) {
  const [open, setOpen] = useState(false);

  if (!items.length) return null;

  return (
    <div className="sticky top-[116px] z-40 -mx-4 mb-4 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-full items-center justify-between bg-brand-700 px-5 text-white shadow-sm"
        aria-expanded={open}
        aria-controls="mobile-toc-panel"
      >
        <span className="text-xs font-black uppercase tracking-[0.22em]">
          Sommaire
        </span>
        <span className="text-base font-black leading-none">☰</span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/20"
            aria-label="Fermer le sommaire"
            onClick={() => setOpen(false)}
          />

          <div
            id="mobile-toc-panel"
            className="fixed inset-x-3 top-[116px] z-50 max-h-[50vh] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
          >
            <div className="flex h-11 items-center justify-between bg-brand-700 px-4 text-white">
              <span className="text-xs font-black uppercase tracking-[0.22em]">
                Sommaire
              </span>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xl font-black leading-none hover:bg-white/25"
                aria-label="Fermer le sommaire"
              >
                ×
              </button>
            </div>

            <nav className="max-h-[calc(50vh-44px)] overflow-y-auto p-3">
              <ul className="space-y-1 text-sm">
                {items.map((item) => (
                  <li key={item.id} className={item.level === 3 ? "pl-3" : ""}>
                    <a
                      href={`#${item.id}`}
                      onClick={() => setOpen(false)}
                      className={`block rounded-xl px-3 py-2 leading-snug transition hover:bg-brand-50 hover:text-brand-700 ${
                        item.level === 3
                          ? "text-sm text-slate-500"
                          : "font-semibold text-slate-850"
                      }`}
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </>
      ) : null}
    </div>
  );
}