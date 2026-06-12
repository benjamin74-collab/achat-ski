// src/app/api/nav/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type FeaturedGuide = { id: number; title: string; slug: string };
type FeaturedBrand = { id: number; name: string; slug: string };

type NavItem = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  order: number;
  featuredGuides: FeaturedGuide[];
  featuredBrands: FeaturedBrand[];
  children: NavItem[];
};

export const runtime = "nodejs";

function sortTree(items: NavItem[]) {
  items.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "fr"));
  for (const it of items) sortTree(it.children);
}

export async function GET() {
  const [categoryRows, guideCategoryRows] = await Promise.all([
    prisma.category.findMany({
      where: { isInMenu: true, published: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true, name: true, slug: true, parentId: true, order: true,
        featuredLinks: {
          orderBy: [{ type: "asc" }, { order: "asc" }, { id: "asc" }],
          select: {
            type: true, order: true,
            page: { select: { id: true, title: true, slug: true, published: true } },
            brand: { select: { id: true, name: true, slug: true, active: true } },
          },
        },
      },
    }),
    prisma.guideCategory.findMany({
      where: { active: true, isInMenu: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const byId = new Map<number, NavItem>();

  categoryRows.forEach((r) => {
    byId.set(r.id, {
      id: r.id, name: r.name, slug: r.slug, parentId: r.parentId, order: r.order,
      featuredGuides: r.featuredLinks
        .filter((l) => l.type === "GUIDE" && l.page?.published)
        .map((l) => ({ id: l.page!.id, title: l.page!.title, slug: l.page!.slug })),
      featuredBrands: r.featuredLinks
        .filter((l) => l.type === "BRAND" && l.brand?.active)
        .map((l) => ({ id: l.brand!.id, name: l.brand!.name, slug: l.brand!.slug })),
      children: [],
    });
  });

  const roots: NavItem[] = [];
  byId.forEach((node) => {
    if (node.parentId !== null && byId.has(node.parentId)) byId.get(node.parentId)!.children.push(node);
    else roots.push(node);
  });

  sortTree(roots);

  return NextResponse.json({ categories: roots, guideCategories: guideCategoryRows });
}
