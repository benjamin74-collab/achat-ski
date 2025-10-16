// src/app/api/nav/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type NavItem = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
  children: NavItem[];
};

export const runtime = "nodejs";

export async function GET() {
  const rows = await prisma.category.findMany({
    where: { isNav: true, published: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, parentId: true, sortOrder: true },
  });

  // index par id
  const byId = new Map<number, NavItem>();
  rows.forEach((r) =>
    byId.set(r.id, { ...r, children: [] })
  );

  // relier parents/enfants
  const roots: NavItem[] = [];
  byId.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return NextResponse.json(roots);
}
