"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

type Props = {
  brands: string[];         // liste des marques possibles (depuis la DB)
  seasons: string[];        // ex: ["2025/26","2024/25"]
};

export default function FiltersBar({ brands, seasons }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // état initial depuis l’URL
  const initialBrands = searchParams.getAll("brand");
  const initialSeason = searchParams.get("season") ?? "";
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrands);
  const [season, setSeason] = useState(initialSeason);

  useEffect(() => {
    setSelectedBrands(searchParams.getAll("brand"));
    setSeason(searchParams.get("season") ?? "");
  }, [searchParams]);

  function toggleBrand(b: string) {
    setSelectedBrands(prev =>
      prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]
    );
  }

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page"); // reset pagination
    params.delete("brand");
    selectedBrands.forEach(b => params.append("brand", b));
    if (season) params.set("season", season); else params.delete("season");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    ["brand","season","page"].forEach(k => params.delete(k));
    router.push(`${pathname}?${params.toString()}`);
  }

  const activeCount = useMemo(
    () => (selectedBrands.length ? 1 : 0) + (season ? 1 : 0),
    [selectedBrands, season]
  );

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Filtres {activeCount ? <span className="text-sm text-neutral-500">({activeCount} actif{activeCount>1?"s":""})</span> : null}</div>
        <button onClick={clearAll} className="text-sm text-neutral-600 hover:underline">Réinitialiser</button>
      </div>

      {/* Marques */}
      <div>
        <div className="text-sm mb-2 text-neutral-600">Marques</div>
        <div className="flex flex-wrap gap-2">
          {brands.map(b => {
            const active = selectedBrands.includes(b);
            return (
              <button
                key={b}
                onClick={() => toggleBrand(b)}
                className={`rounded-xl border px-3 py-1.5 text-sm ${active ? "bg-neutral-900 text-white border-neutral-900" : "hover:bg-neutral-50"}`}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>

      {/* Saison */}
      <div>
        <div className="text-sm mb-2 text-neutral-600">Saison</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSeason("")}
            className={`rounded-xl border px-3 py-1.5 text-sm ${season==="" ? "bg-neutral-900 text-white border-neutral-900" : "hover:bg-neutral-50"}`}
          >
            Toutes
          </button>
          {seasons.map(s => (
            <button
              key={s}
              onClick={() => setSeason(s)}
              className={`rounded-xl border px-3 py-1.5 text-sm ${season===s ? "bg-neutral-900 text-white border-neutral-900" : "hover:bg-neutral-50"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={apply} className="btn">Appliquer</button>
      </div>
    </div>
  );
}
