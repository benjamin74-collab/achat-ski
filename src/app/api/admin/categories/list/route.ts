// src/app/api/admin/categories/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export async function GET() {
  const cats = await prisma.category.findMany({
    where: { published: true },
    orderBy: [{ parentId: "asc" }, { order: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  return NextResponse.json(cats);
}
