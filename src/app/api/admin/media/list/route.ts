// src/app/api/admin/media/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { MediaKind } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(100, Math.max(1, Number(limitParam))) : 50;
  const kindParam = searchParams.get("kind");

  const where: { kind?: MediaKind } = {};
  if (kindParam) {
    where.kind = kindParam as MediaKind;
  }

  const assets = await prisma.mediaAsset.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      publicUrl: true,
      title: true,
      alt: true,
      width: true,
      height: true,
      mime: true,
    },
  });

  return NextResponse.json({ assets });
}
