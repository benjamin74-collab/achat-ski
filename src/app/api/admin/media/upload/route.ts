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
  // on n’utilise plus `kind` pour éviter l’avertissement no-unused-vars
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

  // chemin: dossier/horodatage-nomfichier
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const cleanName = file.name.replace(/[^\w.\-]+/g, "_");
  const pathname = `${folder}/${ts}-${cleanName}`;

  // Upload vers Vercel Blob
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type || undefined,
    token, // important pour le runtime
  });

  // File.size est typé `number` dans lib.dom.d.ts → pas besoin de `any`
  const bytes: number | null = Number.isFinite(file.size) ? file.size : null;

  // Enregistrement base (modèle MediaAsset du schéma Prisma)
  const asset = await prisma.mediaAsset.create({
    data: {
      kind: "IMAGE", // enum MediaKind
      mime: file.type || "application/octet-stream",
      width: null,
      height: null,
      bytes,
      storageKey: blob.pathname, // ex: uploads/2025-11-07-...-image.png
      publicUrl: blob.url,
      title: title || null,
      alt: alt || null,
      createdById: session.user.id, // User.id (String)
    },
    select: {
      id: true,
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
