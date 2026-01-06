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
  const rows = await prisma.category.findMany({
    where: { isInMenu: true, published: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, parentId: true, order: true },
  });

  // index par id
  const byId = new Map<number, NavItem>();
  rows.forEach((r) => byId.set(r.id, { ...r, children: [] }));

  // relier parents/enfants
  const roots: NavItem[] = [];
  byId.forEach((node) => {
    if (node.parentId !== null && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // trie récursif (parents + enfants + petits-enfants)
  sortTree(roots);

  return NextResponse.json(roots);
}
