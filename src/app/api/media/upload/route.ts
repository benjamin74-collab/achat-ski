// src/app/api/media/upload/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToBlob } from "@/lib/blob";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const title = String(form.get("title") || "");
  const alt = String(form.get("alt") || "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }

  const contentType = file.type || "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
  }

  const keyPrefix = "media/images";
  const { storageKey, publicUrl } = await uploadToBlob(file, keyPrefix, contentType);

  // dimensions (optionnel) — laisser null si tu ne veux pas parser
  const bytes = file.size;

  const asset = await prisma.mediaAsset.create({
    data: {
      slug: `${slugify(title || file.name)}-${Math.random().toString(36).slice(2, 6)}`,
      title: title || file.name,
      alt: alt || "",
      kind: "IMAGE",
      mime: contentType,
      bytes,
      storageKey,
      publicUrl,
      createdById: session.user.id || null,
    },
  });

  return NextResponse.json({ ok: true, asset });
}
