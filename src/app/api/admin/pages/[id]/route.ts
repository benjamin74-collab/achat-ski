// src/app/api/admin/pages/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { revalidatePath } from "next/cache";
import { sanitizeHtml } from "@/lib/sanitize";
import type { Prisma, PageKind } from "@prisma/client";

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

  const existing = await prisma.page.findUnique({
    where: { id: idNum },
    select: { slug: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fd = await req.formData();

  const title = String(fd.get("title") ?? "").trim();
  const slug = slugify(String(fd.get("slug") ?? title));
  const intro = (fd.get("intro") as string | null) ?? null;
  const content = sanitizeHtml(String(fd.get("content") ?? ""));

  const metaTitle = String(fd.get("metaTitle") ?? "").trim() || null;
  const metaDescription = String(fd.get("metaDescription") ?? "").trim() || null;
  const published = fd.get("published") === "on";

  const tagsArray = String(fd.get("tags") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const kindStr = String(fd.get("kind") || "ARTICLE").toUpperCase();
  const kind: PageKind = ["GUIDE", "COMPARATIF", "ARTICLE"].includes(kindStr)
    ? (kindStr as PageKind)
    : "ARTICLE";

  const categoryIdRaw = fd.get("categoryId");
  const categoryId =
    categoryIdRaw && String(categoryIdRaw).trim() !== ""
      ? Number(String(categoryIdRaw))
      : null;

  const guideCategoryIdRaw = fd.get("guideCategoryId");
  const guideCategoryId =
    guideCategoryIdRaw && String(guideCategoryIdRaw).trim() !== ""
      ? Number(String(guideCategoryIdRaw))
      : null;

  const thumbnailUrl = String(fd.get("thumbnailUrl") ?? "").trim() || null;
  const bannerUrl = String(fd.get("bannerUrl") ?? "").trim() || null;

  const thumbnailAssetIdRaw = fd.get("thumbnailAssetId");
  const bannerAssetIdRaw = fd.get("bannerAssetId");

  const thumbnailAssetId =
    thumbnailAssetIdRaw && String(thumbnailAssetIdRaw).trim() !== ""
      ? Number(String(thumbnailAssetIdRaw))
      : null;

  const bannerAssetId =
    bannerAssetIdRaw && String(bannerAssetIdRaw).trim() !== ""
      ? Number(String(bannerAssetIdRaw))
      : null;

  const data: Prisma.PageUpdateInput = {
    title,
    slug,
    intro,
    content,
    metaTitle,
    metaDescription,
    published,
    kind,
    tags: { set: tagsArray },

    ...(categoryId
      ? { category: { connect: { id: categoryId } } }
      : { category: { disconnect: true } }),

    ...(kind === "GUIDE"
      ? guideCategoryId
        ? { guideCategory: { connect: { id: guideCategoryId } } }
        : { guideCategory: { disconnect: true } }
      : { guideCategory: { disconnect: true } }),

    banner: bannerAssetId ? { connect: { id: bannerAssetId } } : { disconnect: true },
    bannerUrl: bannerAssetId ? null : bannerUrl,

    thumbnail: thumbnailAssetId ? { connect: { id: thumbnailAssetId } } : { disconnect: true },
    thumbnailUrl: thumbnailAssetId ? null : thumbnailUrl,
  };

  const updated = await prisma.page.update({
    where: { id: idNum },
    data,
    select: { id: true, slug: true },
  });

  revalidatePath("/pages");
  revalidatePath(`/pages/${existing.slug}`);
  revalidatePath(`/pages/${updated.slug}`);
  revalidatePath("/admin/pages");

  return NextResponse.json({ ok: true, id: updated.id, slug: updated.slug });
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
  revalidatePath("/admin/pages");

  return NextResponse.json({ ok: true });
}