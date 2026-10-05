import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ProductContentStatus } from "@prisma/client";
import { importProductContentCsv } from "./actions";
import ProductSelectionExport from "./ProductSelectionExport";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  brand?: string;
  category?: string;
  status?: string;
  page?: string;
  imported?: string;
  created?: string;
  updated?: string;
  ignored?: string;
  errors?: string;
  importError?: string;
}>;

const PAGE_SIZE = 30;

export default async function AdminProductContentPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const q = String(params.q ?? "").trim();
  const brandId = Number(params.brand) || undefined;
  const categoryId = Number(params.category) || undefined;
  const status = String(params.status ?? "");
  const currentPage = Math.max(1, Number(params.page) || 1);

  const imported = Number(params.imported) || 0;
  const created = Number(params.created) || 0;
  const updated = Number(params.updated) || 0;
  const ignored = Number(params.ignored) || 0;
  const importErrors = Number(params.errors) || 0;
  const importError = String(params.importError ?? "").trim();

  const where = {
    active: true,

    ...(q
      ? {
          OR: [
            {
              name: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
            {
              model: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
            {
              brand: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
            {
              manufacturerReference: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
            {
              gtin: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
            {
              Brand: {
                name: {
                  contains: q,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),

    ...(brandId ? { brandId } : {}),
    ...(categoryId ? { categoryId } : {}),

    ...(status === "NONE"
      ? {
          content: null,
        }
      : {}),

    ...(status === "DRAFT"
      ? {
          content: {
            is: {
              status: ProductContentStatus.DRAFT,
            },
          },
        }
      : {}),

    ...(status === "PUBLISHED"
      ? {
          content: {
            is: {
              status: ProductContentStatus.PUBLISHED,
            },
          },
        }
      : {}),
  };

  const [products, total, brands, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [
        {
          published: "desc",
        },
        {
          name: "asc",
        },
        {
          model: "asc",
        },
      ],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        model: true,
        slug: true,
        brand: true,
        manufacturerReference: true,
        imageUrl: true,
        published: true,

        Brand: {
          select: {
            id: true,
            name: true,
          },
        },

        category: {
          select: {
            id: true,
            name: true,
          },
        },

        content: {
          select: {
            status: true,
            updatedAt: true,
          },
        },
      },
    }),

    prisma.product.count({
      where,
    }),

    prisma.brand.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),

    prisma.category.findMany({
      where: {
        published: true,
      },
      orderBy: [{ parentId: "asc" }, { order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildExportUrl() {
    const query = new URLSearchParams();

    if (q) query.set("q", q);
    if (brandId) query.set("brand", String(brandId));
    if (categoryId) query.set("category", String(categoryId));
    if (status) query.set("status", status);

    const suffix = query.toString();

    return suffix
      ? `/admin/products/content/export?${suffix}`
      : "/admin/products/content/export";
  }

  function buildPageUrl(page: number) {
    const query = new URLSearchParams();

    if (q) query.set("q", q);
    if (brandId) query.set("brand", String(brandId));
    if (categoryId) query.set("category", String(categoryId));
    if (status) query.set("status", status);

    query.set("page", String(page));

    return `/admin/products/content?${query.toString()}`;
  }

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { href: "/admin", label: "Admin" },
          { label: "Contenu produits" },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-xl font-bold">Contenu produits</h1>

        <p className="mt-1 text-sm text-neutral-500">
          Gérez les contenus éditoriaux et SEO des produits indépendamment des
          descriptions provenant des flux marchands.
        </p>
      </div>

      {importError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Import impossible : {importError}
        </div>
      ) : null}

      {imported > 0 || ignored > 0 || importErrors > 0 ? (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          Import terminé : {created} créé{created > 1 ? "s" : ""},{" "}
          {updated} mis à jour, {ignored} ignoré{ignored > 1 ? "s" : ""},{" "}
          {importErrors} erreur{importErrors > 1 ? "s" : ""}.
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-surface/60 p-4">
          <h2 className="font-semibold">Exporter les produits</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Exporte tous les produits correspondant aux filtres actuels,
            ou utilisez les cases du tableau pour exporter seulement une sélection.
          </p>

          <Link
            href={buildExportUrl()}
            className="btn mt-4 inline-flex"
          >
            Exporter tous les résultats filtrés
          </Link>
        </div>

        <div className="rounded-2xl border bg-surface/60 p-4">
          <h2 className="font-semibold">Importer des contenus</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Réimporte un CSV contenant productId, metaTitle,
            metaDescription, description et éventuellement status.
          </p>

          <form
            action={importProductContentCsv}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <input
              type="file"
              name="file"
              accept=".csv,text/csv"
              required
              className="block w-full text-sm"
            />
            <button type="submit" className="btn whitespace-nowrap">
              Importer le CSV
            </button>
          </form>
        </div>
      </div>

      <form
        method="GET"
        className="mb-6 grid gap-3 rounded-2xl border bg-surface/60 p-4 md:grid-cols-4"
      >
        <div>
          <label className="mb-1 block text-sm">Recherche</label>

          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Produit, référence, EAN..."
            className="w-full rounded-xl border border-ring px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm">Marque</label>

          <select
            name="brand"
            defaultValue={brandId ? String(brandId) : ""}
            className="w-full rounded-xl border border-ring px-3 py-2 text-sm"
          >
            <option value="">Toutes les marques</option>

            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm">Catégorie</label>

          <select
            name="category"
            defaultValue={categoryId ? String(categoryId) : ""}
            className="w-full rounded-xl border border-ring px-3 py-2 text-sm"
          >
            <option value="">Toutes les catégories</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm">Contenu</label>

          <select
            name="status"
            defaultValue={status}
            className="w-full rounded-xl border border-ring px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            <option value="NONE">Sans contenu</option>
            <option value="DRAFT">Brouillon</option>
            <option value="PUBLISHED">Publié</option>
          </select>
        </div>

        <div className="flex items-center gap-3 md:col-span-4">
          <button type="submit" className="btn">
            Filtrer
          </button>

          <Link
            href="/admin/products/content"
            className="text-sm underline"
          >
            Réinitialiser
          </Link>

          <span className="ml-auto text-sm text-neutral-500">
            {total} produit{total > 1 ? "s" : ""}
          </span>
        </div>
      </form>

      <ProductSelectionExport
        productIds={products.map((product) => product.id)}
      >
        <div className="overflow-hidden rounded-2xl border bg-surface/60">
          <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="w-10 p-3 text-center">
                <span className="sr-only">Sélection</span>
              </th>
              <th className="p-3 text-left">Produit</th>
              <th className="p-3 text-left">Marque</th>
              <th className="p-3 text-left">Catégorie</th>
              <th className="p-3 text-center">Catalogue</th>
              <th className="p-3 text-center">Contenu</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => {
              const productName =
                product.name ||
                [product.Brand?.name || product.brand, product.model]
                  .filter(Boolean)
                  .join(" ");

              return (
                <tr key={product.id} className="border-t">
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      name="product-selection"
                      value={product.id}
                      data-product-selection
                      aria-label={`Sélectionner ${productName}`}
                      className="h-4 w-4 rounded border-ring"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt=""
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-lg object-contain"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted/50" />
                      )}

                      <div>
                        <div className="font-medium">{productName}</div>

                        {product.manufacturerReference ? (
                          <div className="text-xs text-neutral-500">
                            Réf. {product.manufacturerReference}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  <td className="p-3">
                    {product.Brand?.name || product.brand || "-"}
                  </td>

                  <td className="p-3">
                    {product.category?.name || "-"}
                  </td>

                  <td className="p-3 text-center">
                    {product.published ? "✅" : "❌"}
                  </td>

                  <td className="p-3 text-center">
                    {!product.content ? (
                      <span className="text-neutral-500">À générer</span>
                    ) : product.content.status ===
                      ProductContentStatus.PUBLISHED ? (
                      <span>Publié</span>
                    ) : (
                      <span>Brouillon</span>
                    )}
                  </td>

                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/products/content/${product.id}/edit`}
                      className="btn btn-sm"
                    >
                      {product.content ? "Modifier" : "Créer"}
                    </Link>
                  </td>
                </tr>
              );
            })}

            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-neutral-500"
                >
                  Aucun produit correspondant aux critères.
                </td>
              </tr>
            ) : null}
          </tbody>
          </table>
        </div>
      </ProductSelectionExport>

      {totalPages > 1 ? (
        <div className="mt-5 flex items-center justify-between">
          <div className="text-sm text-neutral-500">
            Page {currentPage} sur {totalPages}
          </div>

          <div className="flex gap-2">
            {currentPage > 1 ? (
              <Link
                href={buildPageUrl(currentPage - 1)}
                className="btn btn-sm"
              >
                ← Précédent
              </Link>
            ) : null}

            {currentPage < totalPages ? (
              <Link
                href={buildPageUrl(currentPage + 1)}
                className="btn btn-sm"
              >
                Suivant →
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}