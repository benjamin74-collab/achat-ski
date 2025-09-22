"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function SearchBar({ placeholder = "Rechercher un produit…" }: { placeholder?: string }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initial = sp.get("q") ?? "";
  const [value, setValue] = useState(initial);
  const [isPending, startTransition] = useTransition();

  // petit debounce local
  const debouncedPush = useMemo(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    return (v: string) => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        const params = new URLSearchParams(Array.from(sp.entries()));
        if (v.trim()) params.set("q", v.trim());
        else params.delete("q");
        params.delete("page"); // reset pagination quand on change la requête
        startTransition(() => {
          router.push(`${pathname}?${params.toString()}`);
        });
      }, 300);
    };
  }, [pathname, router, sp]);

  useEffect(() => setValue(initial), [initial]);

  return (
    <div className="w-full max-w-2xl">
      <label className="sr-only">Recherche</label>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            debouncedPush(e.target.value);
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isPending && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-60">…</span>
        )}
      </div>
    </div>
  );
}
