"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SortKey = "newest" | "price-asc" | "price-desc";

export default function SortSelect() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const value = (searchParams.get("sort") as SortKey) || "newest";

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={value}
      onChange={onChange}
      className="rounded-xl border px-3 py-2 text-sm"
      aria-label="Trier par"
    >
      <option value="newest">Plus récents</option>
      <option value="price-asc">Prix croissant</option>
      <option value="price-desc">Prix décroissant</option>
    </select>
  );
}
