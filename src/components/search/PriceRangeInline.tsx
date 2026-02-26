"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  nameMin?: string; // default "min"
  nameMax?: string; // default "max"
  minBound: number; // euros
  maxBound: number; // euros
  initialMin?: number | null;
  initialMax?: number | null;
};

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

export default function PriceRangeInline({
  nameMin = "min",
  nameMax = "max",
  minBound,
  maxBound,
  initialMin = null,
  initialMax = null,
}: Props) {
  const safeMin = Math.max(0, Math.floor(minBound));
  const safeMax = Math.max(safeMin, Math.floor(maxBound));

  const init = useMemo(() => {
    const min = initialMin != null ? clamp(Math.floor(initialMin), safeMin, safeMax) : safeMin;
    const max = initialMax != null ? clamp(Math.floor(initialMax), safeMin, safeMax) : safeMax;
    return min <= max ? { min, max } : { min: max, max: min };
  }, [initialMin, initialMax, safeMin, safeMax]);

  const [min, setMin] = useState(init.min);
  const [max, setMax] = useState(init.max);

  useEffect(() => {
    setMin(init.min);
    setMax(init.max);
  }, [init.min, init.max]);

  const range = Math.max(1, safeMax - safeMin);
  const leftPct = ((min - safeMin) / range) * 100;
  const rightPct = 100 - ((max - safeMin) / range) * 100;

  const minOnTop = min > safeMax - Math.ceil(range * 0.1);

  const onMin = (v: number) => setMin(clamp(v, safeMin, max));
  const onMax = (v: number) => setMax(clamp(v, min, safeMax));

  return (
    <div className="rounded-xl border px-3 py-2 bg-white">
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-600 whitespace-nowrap">Prix</span>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={safeMin}
            max={safeMax}
            value={min}
            onChange={(e) => onMin(Number(e.target.value))}
            className="w-20 rounded-lg border px-2 py-1 text-sm"
            aria-label="Prix minimum"
          />
          <span className="text-neutral-400">—</span>
          <input
            type="number"
            min={safeMin}
            max={safeMax}
            value={max}
            onChange={(e) => onMax(Number(e.target.value))}
            className="w-20 rounded-lg border px-2 py-1 text-sm"
            aria-label="Prix maximum"
          />
        </div>

        <div className="relative flex-1 h-6 min-w-[140px]">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-neutral-200" />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-blue-600"
            style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
          />

          <input
            type="range"
            min={safeMin}
            max={safeMax}
            value={min}
            onChange={(e) => onMin(Number(e.target.value))}
            className={`absolute inset-0 w-full bg-transparent pointer-events-none appearance-none ${
              minOnTop ? "z-20" : "z-10"
            }`}
            aria-label="Curseur prix minimum"
          />
          <input
            type="range"
            min={safeMin}
            max={safeMax}
            value={max}
            onChange={(e) => onMax(Number(e.target.value))}
            className={`absolute inset-0 w-full bg-transparent pointer-events-none appearance-none ${
              minOnTop ? "z-10" : "z-20"
            }`}
            aria-label="Curseur prix maximum"
          />

          <style jsx>{`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 16px;
              height: 16px;
              border-radius: 9999px;
              background: white;
              border: 2px solid rgb(37 99 235);
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
              pointer-events: auto;
              cursor: pointer;
            }
            input[type="range"]::-moz-range-thumb {
              width: 16px;
              height: 16px;
              border-radius: 9999px;
              background: white;
              border: 2px solid rgb(37 99 235);
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
              pointer-events: auto;
              cursor: pointer;
            }
            input[type="range"]::-webkit-slider-runnable-track {
              background: transparent;
            }
            input[type="range"]::-moz-range-track {
              background: transparent;
            }
          `}</style>
        </div>
      </div>

      {/* hidden inputs for GET */}
      <input type="hidden" name={nameMin} value={String(min)} />
      <input type="hidden" name={nameMax} value={String(max)} />
    </div>
  );
}