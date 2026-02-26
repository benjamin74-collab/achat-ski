"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  nameMin?: string; // default "min"
  nameMax?: string; // default "max"
  label?: string;   // default "Prix €"
  minBound: number; // euros
  maxBound: number; // euros
  initialMin?: number | null; // euros
  initialMax?: number | null; // euros
};

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

export default function PriceRange({
  nameMin = "min",
  nameMax = "max",
  label = "Prix €",
  minBound,
  maxBound,
  initialMin = null,
  initialMax = null,
}: Props) {
  const safeMinBound = Math.max(0, Math.floor(minBound));
  const safeMaxBound = Math.max(safeMinBound, Math.floor(maxBound));

  const init = useMemo(() => {
    const min = initialMin != null ? clamp(Math.floor(initialMin), safeMinBound, safeMaxBound) : safeMinBound;
    const max = initialMax != null ? clamp(Math.floor(initialMax), safeMinBound, safeMaxBound) : safeMaxBound;
    return min <= max ? { min, max } : { min: max, max: min };
  }, [initialMin, initialMax, safeMinBound, safeMaxBound]);

  const [min, setMin] = useState(init.min);
  const [max, setMax] = useState(init.max);

  // si l’URL change (navigation), on resync
  useEffect(() => {
    setMin(init.min);
    setMax(init.max);
  }, [init.min, init.max]);

  // handlers
  const onMinNumber = (v: number) => {
    const next = clamp(v, safeMinBound, max);
    setMin(next);
  };
  const onMaxNumber = (v: number) => {
    const next = clamp(v, min, safeMaxBound);
    setMax(next);
  };

  const onMinRange = (v: number) => {
    const next = clamp(v, safeMinBound, max);
    setMin(next);
  };
  const onMaxRange = (v: number) => {
    const next = clamp(v, min, safeMaxBound);
    setMax(next);
  };

  return (
    <div className="rounded-xl border px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-neutral-600 whitespace-nowrap">{label}</span>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={safeMinBound}
            max={safeMaxBound}
            value={min}
            onChange={(e) => onMinNumber(Number(e.target.value))}
            className="w-24 rounded-lg border px-2 py-1 text-sm"
            aria-label="Prix minimum"
          />
          <span className="text-neutral-400">—</span>
          <input
            type="number"
            min={safeMinBound}
            max={safeMaxBound}
            value={max}
            onChange={(e) => onMaxNumber(Number(e.target.value))}
            className="w-24 rounded-lg border px-2 py-1 text-sm"
            aria-label="Prix maximum"
          />
        </div>
      </div>

      {/* sliders */}
      <div className="mt-3">
        <div className="relative h-6">
          {/* range min */}
          <input
            type="range"
            min={safeMinBound}
            max={safeMaxBound}
            value={min}
            onChange={(e) => onMinRange(Number(e.target.value))}
            className="absolute inset-0 w-full"
            aria-label="Curseur prix minimum"
          />
          {/* range max */}
          <input
            type="range"
            min={safeMinBound}
            max={safeMaxBound}
            value={max}
            onChange={(e) => onMaxRange(Number(e.target.value))}
            className="absolute inset-0 w-full"
            aria-label="Curseur prix maximum"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>{safeMinBound}€</span>
          <span>{safeMaxBound}€</span>
        </div>
      </div>

      {/* hidden inputs for GET form */}
      <input type="hidden" name={nameMin} value={String(min)} />
      <input type="hidden" name={nameMax} value={String(max)} />
    </div>
  );
}