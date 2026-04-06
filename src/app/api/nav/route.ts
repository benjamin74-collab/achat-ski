// src/app/api/nav/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type NavItem = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  order: number;
  children: NavItem[];
};

export const runtime = "nodejs";

function sortTree(items: NavItem[]) {
  items.sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name, "fr"));
  for (const it of items) sortTree(it.children);
}

export async function GET() {
  const [categoryRows, guideCategoryRows] = await Promise.all([
    prisma.category.findMany({
      where: { isInMenu: true, published: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, parentId: true, order: true },
    }),
    prisma.guideCategory.findMany({
      where: { active: true, isInMenu: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const byId = new Map<number, NavItem>();
  categoryRows.forEach((r) => byId.set(r.id, { ...r, children: [] }));

  const roots: NavItem[] = [];
  byId.forEach((node) => {
    if (node.parentId !== null && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  sortTree(roots);

  return NextResponse.json({
    categories: roots,
    guideCategories: guideCategoryRows,
  });
}