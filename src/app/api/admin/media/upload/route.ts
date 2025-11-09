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
  const kind = String(form.get("kind") || "generic");
  const alt = String(form.get("alt") || "");
  const title = String(form.get("title") || "");
  const folder = String(form.get("folder") || "uploads");

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // ✅ Récupère le token côté serveur
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Missing BLOB_READ_WRITE_TOKEN at runtime" },
      { status: 500 }
    );
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const cleanName = file.name.replace(/[^\w.\-]+/g, "_");
  const pathname = `${folder}/${ts}-${cleanName}`;

  // ✅ On passe explicitement le token à put()
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type || undefined,
    token, // 👈 important
  });

  const asset = await prisma.mediaAsset.create({
    data: {
      // Si votre modèle s’appelle différemment (mime/publicUrl/storageKey), adaptez ici :
      kind: "IMAGE",
      mime: file.type || "application/octet-stream",
      width: null,
      height: null,
      bytes: typeof (file as any).size === "number" ? (file as any).size : null,
      storageKey: blob.pathname,
      publicUrl: blob.url,
      title: title || null,
      alt: alt || null,
      createdById: session.user.id,
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
