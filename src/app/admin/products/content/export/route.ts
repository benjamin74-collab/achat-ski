import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ProductContentStatus, Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  const text =
    typeof value === "string"
      ? value
      : JSON.stringify(value);

  return `"${text.replace(/"/g, '""')}"`;
}

function parseSelectedIds(value: string | null): number[] {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  );
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const selectedIds = parseSelectedIds(
    request.nextUrl.searchParams.get("ids")
  );

  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  const brandId =
    Number(request.nextUrl.searchParams.get("brand")) || undefined;
  const categoryId =
    Number(request.nextUrl.searchParams.get("category")) || undefined;
  const status =
    request.nextUrl.searchParams.get("status")?.trim() || "";

  const where: Prisma.ProductWhereInput =
    selectedIds.length > 0
      ? {
          active: true,
          id: {
            in: selectedIds,
          },
        }
      : {
          active: true,

          ...(q
            ? {
                OR: [
                  {
                    name: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                  {
                    model: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                  {
                    brand: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                  {
                    manufacturerReference: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                  {
                    gtin: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                  {
                    Brand: {
                      name: {
                        contains: q,
                        mode: "insensitive",
                      },
                    },
                  },
                ],
              }
            : {}),

          ...(brandId ? { brandId } : {}),
          ...(categoryId ? { categoryId } : {}),

          ...(status === "NONE"
            ? { content: null }
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

  const products = await prisma.product.findMany({
    where,
    orderBy: [
      { published: "desc" },
      { name: "asc" },
      { model: "asc" },
    ],
    select: {
      id: true,
      name: true,
      brand: true,
      model: true,
      season: true,
      gtin: true,
      manufacturerReference: true,
      slug: true,
      description: true,
      attributes: true,
      Brand: {
        select: {
          name: true,
        },
      },
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
      content: {
        select: {
          metaTitle: true,
          metaDescription: true,
          description: true,
          status: true,
        },
      },
    },
  });

  const headers = [
    "productId",
    "name",
    "brand",
    "model",
    "category",
    "categorySlug",
    "season",
    "manufacturerReference",
    "gtin",
    "slug",
    "catalogDescription",
    "attributes",
    "metaTitle",
    "metaDescription",
    "description",
    "status",
  ];

  const lines = [
    headers.map(csvCell).join(","),
    ...products.map((product) =>
      [
        product.id,
        product.name || "",
        product.Brand?.name || product.brand || "",
        product.model,
        product.category?.name || "",
        product.category?.slug || "",
        product.season || "",
        product.manufacturerReference || "",
        product.gtin || "",
        product.slug,
        product.description || "",
        product.attributes ?? "",
        product.content?.metaTitle || "",
        product.content?.metaDescription || "",
        product.content?.description || "",
        product.content?.status || "",
      ]
        .map(csvCell)
        .join(",")
    ),
  ];

  const csv = `\uFEFF${lines.join("\r\n")}`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="meilleur-ski-produits-contenus.csv"',
      "Cache-Control": "no-store",
    },
  });
}
