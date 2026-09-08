// src/app/api/admin/pages/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { revalidatePath } from "next/cache";
import { sanitizeHtml } from "@/lib/sanitize";
import type { Prisma, PageKind } from "@prisma/client";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const idNum = Number(params.id);

  if (!Number.isFinite(idNum)) {
    return NextResponse.json(
      { error: "Invalid id" },
      { status: 400 }
    );
  }

  const existing = await prisma.page.findUnique({
    where: { id: idNum },
    select: { slug: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  const fd = await req.formData();

  /*
   * Produits associés à la page
   *
   * Important :
   * - pageProducts === null => le champ n'a pas été envoyé :
   *   on ne touche pas aux associations existantes.
   *
   * - pageProducts === [] => le champ a bien été envoyé,
   *   mais aucun produit n'est sélectionné :
   *   on supprime les associations existantes.
   */
  type SubmittedPageProduct = {
    productId: number;
    position: number;
    label: string | null;
    featured: boolean;
  };

  const pageProductsRaw = fd.get("pageProducts");

  let pageProducts: SubmittedPageProduct[] | null = null;

  if (pageProductsRaw !== null) {
    try {
      const parsed = JSON.parse(String(pageProductsRaw));

      if (!Array.isArray(parsed)) {
        return NextResponse.json(
          { error: "Invalid pageProducts" },
          { status: 400 }
        );
      }

      const seen = new Set<number>();

      pageProducts = parsed
        .map((item, index) => {
          const productId = Number(item?.productId);

          if (
            !Number.isInteger(productId) ||
            productId <= 0 ||
            seen.has(productId)
          ) {
            return null;
          }

          seen.add(productId);

          return {
            productId,
            position: index,

            label:
              typeof item?.label === "string" &&
              item.label.trim()
                ? item.label.trim().slice(0, 150)
                : null,

            featured: item?.featured === true,
          };
        })
        .filter(
          (
            item
          ): item is SubmittedPageProduct =>
            item !== null
        );
    } catch {
      return NextResponse.json(
        { error: "Invalid pageProducts" },
        { status: 400 }
      );
    }
  }

  /*
   * Un seul produit peut être mis en avant.
   * Si plusieurs produits arrivent avec featured=true,
   * seul le premier est conservé.
   */
  if (pageProducts) {
    let featuredFound = false;

    pageProducts = pageProducts.map((item) => {
      if (!item.featured) {
        return item;
      }

      if (featuredFound) {
        return {
          ...item,
          featured: false,
        };
      }

      featuredFound = true;

      return item;
    });
  }

  const title = String(fd.get("title") ?? "").trim();

  const slug = slugify(
    String(fd.get("slug") ?? title)
  );

  const intro =
    (fd.get("intro") as string | null) ?? null;

  const content = sanitizeHtml(
    String(fd.get("content") ?? "")
  );

  const metaTitle =
    String(fd.get("metaTitle") ?? "").trim() ||
    null;

  const metaDescription =
    String(
      fd.get("metaDescription") ?? ""
    ).trim() || null;

  const published =
    fd.get("published") === "on";

  const tagsArray = String(
    fd.get("tags") ?? ""
  )
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  /*
   * Type de page
   */
  const kindStr = String(
    fd.get("kind") || "ARTICLE"
  ).toUpperCase();

  const kind: PageKind = [
    "GUIDE",
    "COMPARATIF",
    "ARTICLE",
  ].includes(kindStr)
    ? (kindStr as PageKind)
    : "ARTICLE";

  /*
   * Catégorie produit éventuelle
   */
  const categoryIdRaw =
    fd.get("categoryId");

  const categoryId =
    categoryIdRaw &&
    String(categoryIdRaw).trim() !== ""
      ? Number(String(categoryIdRaw))
      : null;

  /*
   * Catégorie de guide éventuelle
   */
  const guideCategoryIdRaw =
    fd.get("guideCategoryId");

  const guideCategoryId =
    guideCategoryIdRaw &&
    String(guideCategoryIdRaw).trim() !== ""
      ? Number(
          String(guideCategoryIdRaw)
        )
      : null;

  /*
   * Images externes
   */
  const thumbnailUrl =
    String(
      fd.get("thumbnailUrl") ?? ""
    ).trim() || null;

  const bannerUrl =
    String(
      fd.get("bannerUrl") ?? ""
    ).trim() || null;

  /*
   * Images issues de la médiathèque
   */
  const thumbnailAssetIdRaw =
    fd.get("thumbnailAssetId");

  const bannerAssetIdRaw =
    fd.get("bannerAssetId");

  const thumbnailAssetId =
    thumbnailAssetIdRaw &&
    String(
      thumbnailAssetIdRaw
    ).trim() !== ""
      ? Number(
          String(thumbnailAssetIdRaw)
        )
      : null;

  const bannerAssetId =
    bannerAssetIdRaw &&
    String(
      bannerAssetIdRaw
    ).trim() !== ""
      ? Number(
          String(bannerAssetIdRaw)
        )
      : null;

  /*
   * Données Prisma
   */
  const data: Prisma.PageUpdateInput = {
    title,
    slug,
    intro,
    content,

    metaTitle,
    metaDescription,

    published,
    kind,

    tags: {
      set: tagsArray,
    },

    /*
     * On ne modifie les PageProduct que si
     * le champ pageProducts a été envoyé.
     */
    ...(pageProducts !== null
      ? {
          products: {
            deleteMany: {},

            create: pageProducts.map(
              (item) => ({
                product: {
                  connect: {
                    id: item.productId,
                  },
                },

                position:
                  item.position,

                label:
                  item.label,

                featured:
                  item.featured,
              })
            ),
          },
        }
      : {}),

    /*
     * Catégorie principale
     */
    ...(categoryId
      ? {
          category: {
            connect: {
              id: categoryId,
            },
          },
        }
      : {
          category: {
            disconnect: true,
          },
        }),

    /*
     * Catégorie de guide
     *
     * Une catégorie de guide n'est conservée
     * que pour les pages de type GUIDE.
     */
    ...(kind === "GUIDE"
      ? guideCategoryId
        ? {
            guideCategory: {
              connect: {
                id: guideCategoryId,
              },
            },
          }
        : {
            guideCategory: {
              disconnect: true,
            },
          }
      : {
          guideCategory: {
            disconnect: true,
          },
        }),

    /*
     * Bannière
     *
     * La médiathèque est prioritaire sur l'URL externe.
     */
    banner: bannerAssetId
      ? {
          connect: {
            id: bannerAssetId,
          },
        }
      : {
          disconnect: true,
        },

    bannerUrl: bannerAssetId
      ? null
      : bannerUrl,

    /*
     * Miniature
     *
     * La médiathèque est prioritaire sur l'URL externe.
     */
    thumbnail: thumbnailAssetId
      ? {
          connect: {
            id: thumbnailAssetId,
          },
        }
      : {
          disconnect: true,
        },

    thumbnailUrl: thumbnailAssetId
      ? null
      : thumbnailUrl,
  };

  const updated =
    await prisma.page.update({
      where: {
        id: idNum,
      },

      data,

      select: {
        id: true,
        slug: true,
      },
    });

  /*
   * Invalidation des caches
   */
  revalidatePath("/pages");

  revalidatePath(
    `/pages/${existing.slug}`
  );

  revalidatePath(
    `/pages/${updated.slug}`
  );

  revalidatePath(
    "/admin/pages"
  );

  return NextResponse.json({
    ok: true,
    id: updated.id,
    slug: updated.slug,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session =
    await getServerSession(authOptions);

  if (
    !session?.user?.role ||
    session.user.role !== "ADMIN"
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const idNum =
    Number(params.id);

  if (!Number.isFinite(idNum)) {
    return NextResponse.json(
      { error: "Invalid id" },
      { status: 400 }
    );
  }

  const toDelete =
    await prisma.page.findUnique({
      where: {
        id: idNum,
      },

      select: {
        slug: true,
      },
    });

  if (!toDelete) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  /*
   * Grâce au onDelete: Cascade sur PageProduct,
   * les associations produits seront supprimées
   * automatiquement avec la page.
   */
  await prisma.page.delete({
    where: {
      id: idNum,
    },
  });

  revalidatePath("/pages");

  revalidatePath(
    `/pages/${toDelete.slug}`
  );

  revalidatePath(
    "/admin/pages"
  );

  return NextResponse.json({
    ok: true,
  });
}