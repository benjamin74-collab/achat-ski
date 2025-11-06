// src/app/api/admin/media/upload/route.ts
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const kind = String(form.get("kind") || "generic"); // "brand-logo" | "page-banner" | "page-thumb" | "user-avatar"...
  const alt = String(form.get("alt") || "");
  const title = String(form.get("title") || "");
  const folder = String(form.get("folder") || "uploads");

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // Nom base : dossier/horodatage-nom
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const cleanName = file.name.replace(/[^\w.\-]+/g, "_");
  const pathname = `${folder}/${ts}-${cleanName}`;

  // Upload vers Blob
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type || undefined,
  });

  // Enregistre en base (MediaAsset)
  const asset = await prisma.mediaAsset.create({
    data: {
      kind,
      url: blob.url,
      pathname: blob.pathname,
      filename: cleanName,
      bytes: blob.size ?? null,
      width: null,
      height: null,
      contentType: file.type || null,
      alt: alt || null,
      title: title || null,
      createdById: session.user.id,
    },
    select: {
      id: true,
      kind: true,
      url: true,
      pathname: true,
      filename: true,
      bytes: true,
      contentType: true,
      alt: true,
      title: true,
    },
  });

  return NextResponse.json({ ok: true, asset });
}
