import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductContentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";
import HtmlEditor from "@/app/admin/categories/partials/HtmlEditor";
import { saveProductContent } from "../../actions";

type Props = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    saved?: string;
  }>;
};

export default async function EditProductContentPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { saved } = await searchParams;

  const productId = Number(id);

  if (!Number.isInteger(productId) || productId <= 0) {
    notFound();
  }

  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      id: true,
      name: true,
      model: true,
      slug: true,
      brand: true,
      gtin: true,
      manufacturerReference: true,
      imageUrl: true,
      description: true,
      published: true,

      Brand: {
        select: {
          name: true,
        },
      },

      category: {
        select: {
          name: true,
        },
      },

      content: {
        select: {
          metaTitle: true,
          metaDescription: true,
          description: true,
          status: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const productName =
    product.name ||
    [product.Brand?.name || product.brand, product.model]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { href: "/admin", label: "Admin" },
          {
            href: "/admin/products/content",
            label: "Contenu produits",
          },
          { label: productName },
        ]}
      />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{productName}</h1>

          <div className="mt-1 text-sm text-neutral-500">
            {product.Brand?.name || product.brand || "Sans marque"}
            {product.category?.name
              ? ` · ${product.category.name}`
              : ""}
          </div>
        </div>

        <Link
          href={`/p/${product.slug}`}
          target="_blank"
          className="btn btn-sm"
        >
          Voir le produit
        </Link>
      </div>

      {saved === "1" ? (
        <div className="mb-5 rounded-xl border p-3 text-sm">
          Contenu enregistré.
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 rounded-2xl border bg-surface/60 p-4 md:grid-cols-[120px_1fr]">
        <div>
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt=""
              className="h-28 w-28 rounded-xl object-contain"
            />
          ) : (
            <div className="h-28 w-28 rounded-xl bg-muted/50" />
          )}
        </div>

        <div className="grid gap-2 text-sm">
          <div>
            <strong>Modèle :</strong> {product.model}
          </div>

          <div>
            <strong>Référence fabricant :</strong>{" "}
            {product.manufacturerReference || "-"}
          </div>

          <div>
            <strong>EAN / GTIN :</strong> {product.gtin || "-"}
          </div>

          <div>
            <strong>Catalogue :</strong>{" "}
            {product.published ? "Publié" : "Non publié"}
          </div>

          <div>
            <strong>Contenu éditorial :</strong>{" "}
            {!product.content
              ? "À générer"
              : product.content.status ===
                  ProductContentStatus.PUBLISHED
                ? "Publié"
                : "Brouillon"}
          </div>
        </div>
      </div>

      {product.description ? (
        <details className="mb-6 rounded-2xl border bg-surface/60 p-4">
          <summary className="cursor-pointer font-medium">
            Description provenant du catalogue
          </summary>

          <div className="mt-4 whitespace-pre-line text-sm text-neutral-600">
            {product.description}
          </div>
        </details>
      ) : null}

      <form action={saveProductContent} className="grid gap-6">
        <input type="hidden" name="productId" value={product.id} />

        <div className="rounded-2xl border bg-surface/60 p-4">
          <h2 className="mb-4 font-semibold">SEO</h2>

          <div className="grid gap-4">
            <div>
              <label
                htmlFor="metaTitle"
                className="mb-1 block text-sm"
              >
                Meta title
              </label>

              <input
                id="metaTitle"
                name="metaTitle"
                type="text"
                defaultValue={product.content?.metaTitle ?? ""}
                className="w-full rounded-xl border border-ring px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="metaDescription"
                className="mb-1 block text-sm"
              >
                Meta description
              </label>

              <textarea
                id="metaDescription"
                name="metaDescription"
                rows={3}
                defaultValue={
                  product.content?.metaDescription ?? ""
                }
                className="w-full rounded-xl border border-ring px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-surface/60 p-4">
          <h2 className="mb-4 font-semibold">
            Description éditoriale
          </h2>

          <HtmlEditor
            name="description"
            initialValue={product.content?.description ?? ""}
            label="Contenu produit"
            rows={18}
            placeholder={
              "<p>Présentation du produit...</p>\n\n<h2>Caractéristiques et usages</h2>\n<p>...</p>"
            }
          />
        </div>

        <div className="rounded-2xl border bg-surface/60 p-4">
          <label
            htmlFor="status"
            className="mb-1 block text-sm"
          >
            Statut
          </label>

          <select
            id="status"
            name="status"
            defaultValue={
              product.content?.status ??
              ProductContentStatus.DRAFT
            }
            className="rounded-xl border border-ring px-3 py-2"
          >
            <option value={ProductContentStatus.DRAFT}>
              Brouillon
            </option>

            <option value={ProductContentStatus.PUBLISHED}>
              Publié
            </option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <Link
            href="/admin/products/content"
            className="text-sm underline"
          >
            ← Retour aux produits
          </Link>

          <button type="submit" className="btn">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}