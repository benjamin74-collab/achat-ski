// src/app/api/media/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromBlob } from "@/lib/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // vérifs de références éventuelles à faire ici (brand.logoId, page.bannerId, etc.)
  // si référencé, retourner 409 (Conflict) avec un message

  await deleteFromBlob(asset.storageKey);
  await prisma.mediaAsset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
