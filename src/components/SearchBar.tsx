"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Suggestion = { label: string; href: string };

export default function SearchBar({ placeholder = "Rechercher un produit…" }: { placeholder?: string }) {
  const sp = useSearchParams();
  const router = useRouter();

  const initial = sp.get("q") ?? "";
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(0);
  const [isPending, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // debounce navigation -> toujours /search
  const debouncedPush = useMemo(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    return (v: string) => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        const params = new URLSearchParams();
        if (v.trim()) params.set("q", v.trim());
        params.set("page", "1");
        startTransition(() => router.push(`/search?${params.toString()}`));
      }, 300);
    };
  }, [router]);

  // fetch suggestions (debounced)
  const debouncedSuggest = useMemo(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    return (v: string) => {
      if (t) clearTimeout(t);
      if (abortRef.current) abortRef.current.abort();
      if (!v.trim()) {
        setItems([]);
        setOpen(false);
        return;
      }
      t = setTimeout(async () => {
        try {
          abortRef.current = new AbortController();
          const res = await fetch(`/api/suggest?q=${encodeURIComponent(v)}`, {
            signal: abortRef.current.signal,
            headers: { accept: "application/json" },
          });
          if (!res.ok) return;
          const data = (await res.json()) as { suggestions: Suggestion[] };
          setItems(data.suggestions);
          setActive(0);
          setOpen(data.suggestions.length > 0);
        } catch {
          /* ignore */
        }
      }, 200);
    };
  }, []);

  // fermer le menu si clic à l’extérieur
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => setValue(initial), [initial]);

  const goToActive = () => {
    const s = items[active];
    if (s) {
      setOpen(false);
      window.location.href = s.href;
    } else {
      const params = new URLSearchParams();
      if (value.trim()) params.set("q", value.trim());
      window.location.href = `/search?${params.toString()}`;
    }
  };

  return (
    <div ref={boxRef} className="w-full max-w-2xl relative">
      <label className="sr-only">Recherche</label>
      <input
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          debouncedPush(v);
          debouncedSuggest(v);
        }}
        onFocus={() => items.length && setOpen(true)}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            setOpen(true);
            return;
          }
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, Math.max(0, items.length - 1)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            goToActive();
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="search-suggest"
        aria-activedescendant={open ? `search-suggest-${active}` : undefined}
      />

      {isPending && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-60">…</span>
      )}

      {open && items.length > 0 && (
        <ul id="search-suggest" role="listbox" className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border bg-white shadow-lg">
          {items.map((s, i) => (
            <li
              key={`${s.href}-${i}`}
              id={`search-suggest-${i}`}
              role="option"
              aria-selected={i === active}
              className={`cursor-pointer px-4 py-2 text-sm ${i === active ? "bg-blue-50" : "hover:bg-gray-50"}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setOpen(false); window.location.href = s.href; }}
            >
              {s.label}
            </li>
          ))}
          <li
            className="border-t px-4 py-2 text-sm text-blue-700 cursor-pointer hover:bg-gray-50"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const params = new URLSearchParams();
              if (value.trim()) params.set("q", value.trim());
              window.location.href = `/search?${params.toString()}`;
            }}
          >
            Voir tous les résultats pour “{value.trim()}”
          </li>
        </ul>
      )}
    </div>
  );
}
