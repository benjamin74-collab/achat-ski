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

  // resync si navigation / URL change
  useEffect(() => {
    setMin(init.min);
    setMax(init.max);
  }, [init.min, init.max]);

  // % pour track
  const range = Math.max(1, safeMaxBound - safeMinBound);
  const leftPct = ((min - safeMinBound) / range) * 100;
  const rightPct = 100 - ((max - safeMinBound) / range) * 100;

  // On met le "min thumb" au-dessus quand il est proche du max (sinon impossible à attraper)
  const minOnTop = min > safeMaxBound - Math.ceil(range * 0.1);

  const onMin = (v: number) => {
    const next = clamp(v, safeMinBound, max);
    setMin(next);
  };
  const onMax = (v: number) => {
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
            onChange={(e) => onMin(Number(e.target.value))}
            className="w-24 rounded-lg border px-2 py-1 text-sm"
            aria-label="Prix minimum"
          />
          <span className="text-neutral-400">—</span>
          <input
            type="number"
            min={safeMinBound}
            max={safeMaxBound}
            value={max}
            onChange={(e) => onMax(Number(e.target.value))}
            className="w-24 rounded-lg border px-2 py-1 text-sm"
            aria-label="Prix maximum"
          />
        </div>
      </div>

      {/* Track + double thumbs */}
      <div className="mt-3">
        <div className="relative h-7">
          {/* Track (gris) */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-neutral-200" />

          {/* Range sélectionné (bleu) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-blue-600"
            style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
          />

          {/* Range inputs superposés
              - pointer-events-none sur la piste (input)
              - pointer-events-auto sur le thumb via CSS pseudo-element
              => permet d’attraper le min même s’il est sous l’autre
          */}
          <input
            type="range"
            min={safeMinBound}
            max={safeMaxBound}
            value={min}
            onChange={(e) => onMin(Number(e.target.value))}
            className={`absolute inset-0 w-full bg-transparent pointer-events-none appearance-none
              ${minOnTop ? "z-20" : "z-10"}`}
            aria-label="Curseur prix minimum"
          />
          <input
            type="range"
            min={safeMinBound}
            max={safeMaxBound}
            value={max}
            onChange={(e) => onMax(Number(e.target.value))}
            className={`absolute inset-0 w-full bg-transparent pointer-events-none appearance-none
              ${minOnTop ? "z-10" : "z-20"}`}
            aria-label="Curseur prix maximum"
          />

          {/* Styles thumbs (inline via global CSS utilitaire Tailwind-like) */}
          <style jsx>{`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 18px;
              height: 18px;
              border-radius: 9999px;
              background: white;
              border: 2px solid rgb(37 99 235); /* blue-600 */
              box-shadow: 0 1px 2px rgba(0,0,0,.12);
              pointer-events: auto; /* IMPORTANT */
              cursor: pointer;
            }
            input[type="range"]::-moz-range-thumb {
              width: 18px;
              height: 18px;
              border-radius: 9999px;
              background: white;
              border: 2px solid rgb(37 99 235);
              box-shadow: 0 1px 2px rgba(0,0,0,.12);
              pointer-events: auto; /* IMPORTANT */
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