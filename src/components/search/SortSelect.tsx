"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Sort = "relevance" | "price_asc" | "price_desc";

export default function SortSelect({ value }: { value: Sort }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function onChange(next: Sort) {
    const params = new URLSearchParams(sp.toString());
    params.set("sort", next);
    params.delete("page"); // reset pagination
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-600">Trier par</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Sort)}
        className="rounded-xl border px-3 py-2 text-sm bg-white"
        title="Trier"
      >
        <option value="relevance">Pertinence</option>
        <option value="price_asc">Prix croissant</option>
        <option value="price_desc">Prix décroissant</option>
      </select>
    </div>
  );
}