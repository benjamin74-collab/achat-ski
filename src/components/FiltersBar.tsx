"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  brands: string[];
  minPrice: number | null;
  maxPrice: number | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function FiltersBar({
  brands,
  minPrice,
  maxPrice,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const hasPriceRange =
    typeof minPrice === "number" &&
    typeof maxPrice === "number" &&
    maxPrice > minPrice;

  const rangeMin = minPrice ?? 0;
  const rangeMax = maxPrice ?? 0;

  function getInitialMin() {
    if (!hasPriceRange) return rangeMin;

    const value = Number(searchParams.get("minPrice"));

    if (!Number.isFinite(value)) {
      return rangeMin;
    }

    return clamp(value, rangeMin, rangeMax);
  }

  function getInitialMax() {
    if (!hasPriceRange) return rangeMax;

    const value = Number(searchParams.get("maxPrice"));

    if (!Number.isFinite(value)) {
      return rangeMax;
    }

    return clamp(value, rangeMin, rangeMax);
  }

  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchParams.getAll("brand"),
  );

  const [selectedMinPrice, setSelectedMinPrice] = useState<number>(
    getInitialMin,
  );

  const [selectedMaxPrice, setSelectedMaxPrice] = useState<number>(
    getInitialMax,
  );

  useEffect(() => {
    setSelectedBrands(searchParams.getAll("brand"));

    if (!hasPriceRange) {
      setSelectedMinPrice(rangeMin);
      setSelectedMaxPrice(rangeMax);
      return;
    }

    const urlMin = Number(searchParams.get("minPrice"));
    const urlMax = Number(searchParams.get("maxPrice"));

    const nextMin = Number.isFinite(urlMin)
      ? clamp(urlMin, rangeMin, rangeMax)
      : rangeMin;

    const nextMax = Number.isFinite(urlMax)
      ? clamp(urlMax, rangeMin, rangeMax)
      : rangeMax;

    setSelectedMinPrice(Math.min(nextMin, nextMax));
    setSelectedMaxPrice(Math.max(nextMin, nextMax));
  }, [
    searchParams,
    hasPriceRange,
    rangeMin,
    rangeMax,
  ]);

  function toggleBrand(brand: string) {
    setSelectedBrands((previous) =>
      previous.includes(brand)
        ? previous.filter((item) => item !== brand)
        : [...previous, brand],
    );
  }

  function handleMinChange(value: number) {
    if (!hasPriceRange) return;

    setSelectedMinPrice(
      Math.min(
        clamp(value, rangeMin, rangeMax),
        selectedMaxPrice,
      ),
    );
  }

  function handleMaxChange(value: number) {
    if (!hasPriceRange) return;

    setSelectedMaxPrice(
      Math.max(
        clamp(value, rangeMin, rangeMax),
        selectedMinPrice,
      ),
    );
  }

  function apply() {
    const params = new URLSearchParams(searchParams.toString());

    // Toute modification de filtre ramène à la première page.
    params.delete("page");

    // Marques
    params.delete("brand");

    selectedBrands.forEach((brand) => {
      params.append("brand", brand);
    });

    // Prix
    params.delete("minPrice");
    params.delete("maxPrice");

    if (hasPriceRange) {
      if (selectedMinPrice > rangeMin) {
        params.set("minPrice", String(selectedMinPrice));
      }

      if (selectedMaxPrice < rangeMax) {
        params.set("maxPrice", String(selectedMaxPrice));
      }
    }

    const query = params.toString();

    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("brand");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("page");

    setSelectedBrands([]);
    setSelectedMinPrice(rangeMin);
    setSelectedMaxPrice(rangeMax);

    const query = params.toString();

    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const priceFilterActive =
    hasPriceRange &&
    (selectedMinPrice > rangeMin ||
      selectedMaxPrice < rangeMax);

  const activeCount = useMemo(
    () =>
      (selectedBrands.length ? 1 : 0) +
      (priceFilterActive ? 1 : 0),
    [selectedBrands, priceFilterActive],
  );

  const minPercent = hasPriceRange
    ? ((selectedMinPrice - rangeMin) /
        (rangeMax - rangeMin)) *
      100
    : 0;

  const maxPercent = hasPriceRange
    ? ((selectedMaxPrice - rangeMin) /
        (rangeMax - rangeMin)) *
      100
    : 100;

  return (
    <div className="card p-4 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">
          Filtres{" "}
          {activeCount ? (
            <span className="text-sm text-neutral-500">
              ({activeCount} actif{activeCount > 1 ? "s" : ""})
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={clearAll}
          className="text-sm text-neutral-600 hover:underline"
        >
          Réinitialiser
        </button>
      </div>

      {/* Marques */}
      {brands.length > 0 && (
        <div>
          <div className="text-sm mb-2 text-neutral-600">
            Marques
          </div>

          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => {
              const active = selectedBrands.includes(brand);

              return (
                <button
                  type="button"
                  key={brand}
                  onClick={() => toggleBrand(brand)}
                  className={`rounded-xl border px-3 py-1.5 text-sm transition ${
                    active
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "hover:bg-neutral-50"
                  }`}
                >
                  {brand}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Prix */}
      {hasPriceRange && (
        <div>
          <div className="text-sm mb-3 text-neutral-600">
            Prix
          </div>

          <div className="flex items-center justify-between gap-3 text-sm font-medium text-neutral-900">
            <span>{selectedMinPrice} €</span>
            <span>{selectedMaxPrice} €</span>
          </div>

          <div className="relative mt-4 h-7">
            {/* Rail complet */}
            <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-200" />

            {/* Portion sélectionnée */}
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-900"
              style={{
                left: `${minPercent}%`,
                right: `${100 - maxPercent}%`,
              }}
            />

            {/* Curseur minimum */}
            <input
              type="range"
              min={rangeMin}
              max={rangeMax}
              step={1}
              value={selectedMinPrice}
              onChange={(event) =>
                handleMinChange(Number(event.target.value))
              }
              aria-label="Prix minimum"
              className="price-range price-range-min"
            />

            {/* Curseur maximum */}
            <input
              type="range"
              min={rangeMin}
              max={rangeMax}
              step={1}
              value={selectedMaxPrice}
              onChange={(event) =>
                handleMaxChange(Number(event.target.value))
              }
              aria-label="Prix maximum"
              className="price-range price-range-max"
            />
          </div>

          <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
            <span>{rangeMin} €</span>
            <span>{rangeMax} €</span>
          </div>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={apply}
          className="btn"
        >
          Appliquer
        </button>
      </div>

      <style jsx>{`
        .price-range {
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 24px;
          margin: 0;
          transform: translateY(-50%);
          appearance: none;
          -webkit-appearance: none;
          background: transparent;
          pointer-events: none;
          outline: none;
        }

        .price-range-min {
          z-index: 3;
        }

        .price-range-max {
          z-index: 4;
        }

        .price-range::-webkit-slider-runnable-track {
          height: 4px;
          background: transparent;
          border: none;
        }

        .price-range::-moz-range-track {
          height: 4px;
          background: transparent;
          border: none;
        }

        .price-range::-webkit-slider-thumb {
          width: 20px;
          height: 20px;
          margin-top: -8px;
          border: 2px solid #171717;
          border-radius: 9999px;
          background: #ffffff;
          cursor: grab;
          appearance: none;
          -webkit-appearance: none;
          pointer-events: auto;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
        }

        .price-range::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border: 2px solid #171717;
          border-radius: 9999px;
          background: #ffffff;
          cursor: grab;
          pointer-events: auto;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
        }

        .price-range::-webkit-slider-thumb:active {
          cursor: grabbing;
        }

        .price-range::-moz-range-thumb:active {
          cursor: grabbing;
        }

        .price-range:focus-visible::-webkit-slider-thumb {
          outline: 2px solid #171717;
          outline-offset: 3px;
        }

        .price-range:focus-visible::-moz-range-thumb {
          outline: 2px solid #171717;
          outline-offset: 3px;
        }
      `}</style>
    </div>
  );
}