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
  const folder = String(form.get("folder") || "uploads"); // ex: brand-logos / pages / avatars ...

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // Nom de fichier propre + chemin de stockage
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const cleanName = (file.name || "upload").replace(/[^\w.\-]+/g, "_");
  const pathname = `${folder}/${ts}-${cleanName}`;

  // Upload vers Vercel Blob
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type || undefined,
  });

  // Génère un slug unique pour le média (basé sur titre ou nom de fichier sans extension)
  const baseSlug =
    slugify(title || cleanName.replace(/\.[^.]+$/, "")) || "media";
  const uniqueSlug = `${baseSlug}-${ts}`.toLowerCase();

  // Enregistrement en base, en respectant le modèle MediaAsset
  const asset = await prisma.mediaAsset.create({
    data: {
      slug: uniqueSlug,
      title: title || null,
      alt: alt || null,
      kind: "IMAGE", // enum MediaKind
      mime: file.type || "application/octet-stream",
      width: null,
      height: null,
      bytes: typeof file.size === "number" ? file.size : null, // 👈 fix ici
      storageKey: blob.pathname, // clé interne (ex: "uploads/2024-11-07-...-image.png")
      publicUrl: blob.url,       // URL publique
      createdById: session.user.id, // User.id (String)
    },
    select: {
      id: true,
      slug: true,
      publicUrl: true,
      mime: true,
      bytes: true,
      title: true,
      alt: true,
    },
  });

  return NextResponse.json({ ok: true, asset });
}
