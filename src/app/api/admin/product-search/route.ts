// src/app/api/admin/product-search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ items: [] });
  }

  const isNumeric = /^\d+$/.test(q);
  let where: Prisma.ProductWhereInput;

  if (isNumeric) {
    // Recherche directe par ID si l'utilisateur tape un numéro
    where = { id: Number(q) };
  } else {
    // Recherche sur brand / model / season / slug
    where = {
      OR: [
        { slug: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { season: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      slug: true,
      brand: true,
      model: true,
      season: true,
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const items = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    label: [p.brand, p.model, p.season].filter(Boolean).join(" "),
  }));

  return NextResponse.json({ items });
}
