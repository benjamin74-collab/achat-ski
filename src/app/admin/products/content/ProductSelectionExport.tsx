"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  productIds: number[];
  children: ReactNode;
};

export default function ProductSelectionExport({
  productIds,
  children,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const allSelected =
    productIds.length > 0 &&
    productIds.every((id) => selectedIds.includes(id));

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const checkboxes = Array.from(
      root.querySelectorAll<HTMLInputElement>("[data-product-selection]")
    );

    const sync = () => {
      setSelectedIds(
        checkboxes
          .filter((checkbox) => checkbox.checked)
          .map((checkbox) => Number(checkbox.value))
          .filter((id) => Number.isInteger(id) && id > 0)
      );
    };

    checkboxes.forEach((checkbox) =>
      checkbox.addEventListener("change", sync)
    );

    sync();

    return () => {
      checkboxes.forEach((checkbox) =>
        checkbox.removeEventListener("change", sync)
      );
    };
  }, [productIds]);

  function toggleAll() {
    const root = rootRef.current;
    if (!root) return;

    const nextChecked = !allSelected;

    root
      .querySelectorAll<HTMLInputElement>("[data-product-selection]")
      .forEach((checkbox) => {
        checkbox.checked = nextChecked;
      });

    setSelectedIds(nextChecked ? productIds : []);
  }

  const exportUrl = useMemo(() => {
    if (selectedIds.length === 0) {
      return null;
    }

    const query = new URLSearchParams();
    query.set("ids", selectedIds.join(","));

    return `/admin/products/content/export?${query.toString()}`;
  }, [selectedIds]);

  return (
    <div ref={rootRef}>
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border bg-surface/60 p-3">
        <button
          type="button"
          onClick={toggleAll}
          className="btn btn-sm"
          disabled={productIds.length === 0}
        >
          {allSelected
            ? "Tout désélectionner"
            : "Tout sélectionner sur cette page"}
        </button>

        <span className="text-sm text-neutral-500">
          {selectedIds.length} produit
          {selectedIds.length > 1 ? "s" : ""} sélectionné
          {selectedIds.length > 1 ? "s" : ""}
        </span>

        {exportUrl ? (
          <a
            href={exportUrl}
            className="btn btn-sm ml-auto"
          >
            Exporter la sélection
          </a>
        ) : (
          <span
            className="btn btn-sm ml-auto cursor-not-allowed opacity-50"
            aria-disabled="true"
          >
            Exporter la sélection
          </span>
        )}
      </div>

      {children}
    </div>
  );
}
