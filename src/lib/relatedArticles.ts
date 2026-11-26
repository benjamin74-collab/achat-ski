import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Pages belong to the database of the current deployment (one Neon DB per site).
// Do not add a global cache: numeric category IDs are local to each database.
export async function getRelatedArticles(currentSlug: string, max = 3) {
  const limit = Number.isFinite(max) ? Math.min(6, Math.max(0, Math.floor(max))) : 3;
  if (!limit) return [];

  const current = await prisma.page.findFirst({
    where: { slug: currentSlug, published: true },
    select: {
      id: true,
      categoryId: true,
      guideCategoryId: true,
      category: { select: { published: true } },
      guideCategory: { select: { active: true } },
    },
  });
  if (!current) return [];

  const categoryId = current.category?.published ? current.categoryId : null;
  const guideCategoryId = current.guideCategory?.active ? current.guideCategoryId : null;
  const baseWhere: Prisma.PageWhereInput = {
    published: true,
    NOT: { id: current.id },
    AND: [
      { OR: [{ categoryId: null }, { category: { published: true } }] },
      { OR: [{ guideCategoryId: null }, { guideCategory: { active: true } }] },
    ],
  };
  const select = {
    id: true, slug: true, title: true, intro: true, createdAt: true,
    thumbnailUrl: true,
    thumbnail: { select: { publicUrl: true } },
    guideCategory: { select: { name: true } },
  } as const;
  const orderBy = [{ createdAt: "desc" }, { id: "desc" }] as const;

  const items = categoryId
    ? await prisma.page.findMany({
        where: { ...baseWhere, categoryId },
        select,
        orderBy: [...orderBy],
        take: limit,
      })
    : [];

  if (items.length < limit && guideCategoryId) {
    const extra = await prisma.page.findMany({
      where: {
        ...baseWhere,
        guideCategoryId,
        id: { notIn: [current.id, ...items.map((item) => item.id)] },
      },
      select,
      orderBy: [...orderBy],
      take: limit - items.length,
    });
    items.push(...extra);
  }
  return items;
}

