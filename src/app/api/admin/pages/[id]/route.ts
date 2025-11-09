// src/app/api/admin/pages/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { revalidatePath } from "next/cache";
import { sanitizeHtml } from "@/lib/sanitize";
import type { Prisma } from "@prisma/client";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const fd = await req.formData();

  const title = String(fd.get("title") ?? "");
  const slug = slugify(String(fd.get("slug") ?? title));
  const intro = (fd.get("intro") as string | null) ?? null;
  const content = sanitizeHtml(String(fd.get("content") ?? ""));

  const metaTitle = (String(fd.get("metaTitle") ?? "").trim() || null) as string | null;
  const metaDescription = (String(fd.get("metaDescription") ?? "").trim() || null) as string | null;
  const published = fd.get("published") === "on";

  const tagsArray = String(fd.get("tags") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Fallback URLs si pas d’asset
  const thumbnailUrl = (String(fd.get("thumbnailUrl") ?? "").trim() || null) as string | null;
  const bannerUrl = (String(fd.get("bannerUrl") ?? "").trim() || null) as string | null;

  // IDs d’assets (facultatifs)
  const thumbnailAssetIdRaw = fd.get("thumbnailAssetId");
  const bannerAssetIdRaw = fd.get("bannerAssetId");
  const thumbnailAssetId = thumbnailAssetIdRaw ? Number(String(thumbnailAssetIdRaw)) : null;
  const bannerAssetId = bannerAssetIdRaw ? Number(String(bannerAssetIdRaw)) : null;

  const data: Prisma.PageUpdateInput = {
    title,
    slug,
    intro,
    content,
    metaTitle,
    metaDescription,
    published,
    // Prisma attend { set: [...] } pour remplacer un tableau
    tags: { set: tagsArray },

    // Bannière: connect si ID fourni, sinon on “libère” la relation et on conserve l’URL de fallback
    banner: bannerAssetId ? { connect: { id: bannerAssetId } } : { disconnect: true },
    bannerUrl: bannerAssetId ? null : bannerUrl,

    // Miniature: même logique
    thumbnail: thumbnailAssetId ? { connect: { id: thumbnailAssetId } } : { disconnect: true },
    thumbnailUrl: thumbnailAssetId ? null : thumbnailUrl,
  };

  const updated = await prisma.page.update({ where: { id: idNum }, data });

  // Revalidations (si le slug change, on nettoie aussi l’ancien)
  revalidatePath("/pages");
  revalidatePath(`/pages/${updated.slug}`);

  return NextResponse.json({ ok: true, slug: updated.slug });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const toDelete = await prisma.page.findUnique({
    where: { id: idNum },
    select: { slug: true },
  });
  if (!toDelete) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.page.delete({ where: { id: idNum } });

  revalidatePath("/pages");
  revalidatePath(`/pages/${toDelete.slug}`);

  return NextResponse.json({ ok: true });
}
