"use client";

import { useEffect, useState } from "react";

export type PageProductItem = {
  productId: number;
  name: string;
  slug: string;
  brand?: string | null;
  model?: string | null;
  imageUrl?: string | null;
  position: number;
  label?: string | null;
  featured: boolean;
};

type SearchProduct = {
  id: number;
  name: string | null;
  model: string;
  slug: string;
  brand: string | null;
  imageUrl: string | null;
};

export default function PageProductsField({
  initial = [],
}: {
  initial?: PageProductItem[];
}) {
  const [items, setItems] = useState<PageProductItem[]>(
    [...initial].sort((a, b) => a.position - b.position)
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();

    if (q.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setSearching(true);

        const res = await fetch(
          `/api/admin/products/search?q=${encodeURIComponent(q)}`,
          {
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          setResults([]);
          return;
        }

        const json = (await res.json()) as {
          products?: SearchProduct[];
        };

        setResults(json.products ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function addProduct(product: SearchProduct) {
    if (items.some((item) => item.productId === product.id)) {
      return;
    }

    setItems((current) => [
      ...current,
      {
        productId: product.id,
        name: product.name || product.model,
        slug: product.slug,
        brand: product.brand,
        model: product.model,
        imageUrl: product.imageUrl,
        position: current.length,
        label: "",
        featured: false,
      },
    ]);

    setQuery("");
    setResults([]);
  }

  function removeProduct(productId: number) {
    setItems((current) =>
      current
        .filter((item) => item.productId !== productId)
        .map((item, index) => ({
          ...item,
          position: index,
        }))
    );
  }

  function updateItem(
    productId: number,
    patch: Partial<PageProductItem>
  ) {
    setItems((current) =>
      current.map((item) =>
        item.productId === productId
          ? {
              ...item,
              ...patch,
            }
          : item
      )
    );
  }

  function move(productId: number, direction: -1 | 1) {
    setItems((current) => {
      const index = current.findIndex(
        (item) => item.productId === productId
      );

      if (index === -1) return current;

      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);

      return next.map((entry, position) => ({
        ...entry,
        position,
      }));
    });
  }

  function setFeatured(productId: number) {
    setItems((current) =>
      current.map((item) => ({
        ...item,
        featured: item.productId === productId,
      }))
    );
  }

  const serialized = items.map((item, position) => ({
    productId: item.productId,
    position,
    label: item.label?.trim() || null,
    featured: item.featured,
  }));

  return (
    <div className="grid gap-5">
      <input
        type="hidden"
        name="pageProducts"
        value={JSON.stringify(serialized)}
      />

      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700">
          Ajouter un produit
        </label>

        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input w-full"
            placeholder="Atomic Redster Q9, Supershape, Rossignol..."
            autoComplete="off"
          />

          {query.trim().length >= 2 && (
            <div className="absolute z-30 left-0 right-0 top-full mt-1 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              {searching ? (
                <div className="p-4 text-sm text-slate-500">
                  Recherche…
                </div>
              ) : results.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  {results.map((product) => {
                    const alreadyAdded = items.some(
                      (item) => item.productId === product.id
                    );

                    return (
                      <button
                        key={product.id}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => addProduct(product)}
                        className="w-full flex items-center gap-3 p-3 text-left border-b border-slate-100 last:border-0 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="w-14 h-14 object-contain rounded bg-white border border-slate-100"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                            —
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="font-medium text-sm text-slate-800">
                            {product.name || product.model}
                          </div>

                          <div className="text-xs text-slate-500">
                            {product.brand
                              ? `${product.brand} · `
                              : ""}
                            #{product.id}
                          </div>

                          {alreadyAdded && (
                            <div className="text-xs text-emerald-600 mt-1">
                              Déjà associé
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-sm text-slate-500">
                  Aucun produit trouvé.
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Recherchez un produit du catalogue puis ajoutez-le à cette page.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Aucun produit associé à cette page.
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item, index) => (
            <div
              key={item.productId}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex gap-3 flex-1 min-w-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-20 h-20 object-contain rounded-lg border border-slate-100 bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      —
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800">
                      {item.name}
                    </div>

                    <div className="text-xs text-slate-500 mt-1">
                      {item.brand && `${item.brand} · `}
                      Produit #{item.productId}
                    </div>

                    <div className="text-xs text-slate-400 mt-1 truncate">
                      /p/{item.slug}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 items-start">
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => move(item.productId, -1)}
                    disabled={index === 0}
                    title="Monter"
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => move(item.productId, 1)}
                    disabled={index === items.length - 1}
                    title="Descendre"
                  >
                    ↓
                  </button>

                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => removeProduct(item.productId)}
                  >
                    Retirer
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mt-4">
                <div className="grid gap-2">
                  <label className="text-xs font-medium text-slate-600">
                    Label éditorial
                  </label>

                  <input
                    type="text"
                    className="input"
                    value={item.label ?? ""}
                    onChange={(e) =>
                      updateItem(item.productId, {
                        label: e.target.value,
                      })
                    }
                    placeholder="Ex : Notre choix polyvalence"
                  />
                </div>

                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 px-3 h-[42px] rounded-lg border border-slate-200 bg-slate-50 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="featuredProduct"
                      checked={item.featured}
                      onChange={() =>
                        setFeatured(item.productId)
                      }
                    />

                    Produit mis en avant
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}