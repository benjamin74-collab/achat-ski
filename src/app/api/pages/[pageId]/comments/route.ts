// src/app/api/pages/[pageId]/comments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: { pageId: string } }) {
  const pageId = Number(params.pageId);
  const rows = await prisma.pageComment.findMany({
    where: { pageId, published: true },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
    take: 100,
  });
  return NextResponse.json(rows.map(r => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    authorName: r.user?.name ?? "Utilisateur",
  })));
}

export async function POST(req: Request, { params }: { params: { pageId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pageId = Number(params.pageId);
  const { body } = await req.json();

  const created = await prisma.pageComment.create({
    data: {
      pageId,
      userId: Number(session.user.id),
      body: String(body ?? "").slice(0, 5000),
      published: true,
    },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json({
    id: created.id,
    body: created.body,
    createdAt: created.createdAt.toISOString(),
    authorName: created.user?.name ?? "Utilisateur",
  });
}
