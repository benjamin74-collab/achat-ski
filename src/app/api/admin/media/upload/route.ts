// src/app/api/admin/media/upload/route.ts
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const alt = String(form.get("alt") || "");
  const title = String(form.get("title") || "");
  const folder = String(form.get("folder") || "uploads");

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Missing BLOB_READ_WRITE_TOKEN at runtime" },
      { status: 500 }
    );
  }

  // nom de fichier nettoyé + chemin
  const tsIso = new Date().toISOString().replace(/[:.]/g, "-");
  const cleanName = file.name.replace(/[^\w.\-]+/g, "_");
  const pathname = `${folder}/${tsIso}-${cleanName}`;

  // upload vers Blob
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type || undefined,
    token,
  });

  // taille du fichier côté runtime
  const bytes: number | null = Number.isFinite(file.size) ? file.size : null;

  // slug unique pour MediaAsset (ex: "salomon-logo-k9j3u4")
  const base = slugify(title || cleanName.replace(/\.[^.]+$/, "")) || "media";
  const uniqueSuffix = Date.now().toString(36);
  const slug = `${base}-${uniqueSuffix}`;

  const asset = await prisma.mediaAsset.create({
    data: {
      slug,                // <-- requis par ton modèle
      kind: "IMAGE",
      mime: file.type || "application/octet-stream",
      width: null,
      height: null,
      bytes,
      storageKey: blob.pathname,  // ex: "uploads/2025-11-07-...-image.png"
      publicUrl: blob.url,        // URL publique
      title: title || null,
      alt: alt || null,
      createdById: session.user.id,
    },
    select: {
      id: true,
      slug: true,
      publicUrl: true,
      storageKey: true,
      mime: true,
      bytes: true,
      title: true,
      alt: true,
    },
  });

  return NextResponse.json({ ok: true, asset });
}
