// src/app/api/admin/pages/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { revalidatePath } from "next/cache";
import { sanitizeHtml } from "@/lib/sanitize";
import type { Prisma, PageKind } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fd = await req.formData();

  const title = String(fd.get("title") || "").trim();
  const slug = slugify(String(fd.get("slug") || title));

  const intro = (fd.get("intro") as string) || null;
  const content = sanitizeHtml((fd.get("content") as string) || "");
  const metaTitle = ((fd.get("metaTitle") as string) || "").trim() || null;
  const metaDescription = ((fd.get("metaDescription") as string) || "").trim() || null;
  const published = fd.get("published") === "on";

  const tags = String(fd.get("tags") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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

  const thumbnailUrl = ((fd.get("thumbnailUrl") as string) || "").trim() || null;
  const bannerUrl = ((fd.get("bannerUrl") as string) || "").trim() || null;

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

  const data: Prisma.PageCreateInput = {
    title,
    slug,
    intro,
    content,
    metaTitle,
    metaDescription,
    published,
    tags,
    kind,

    ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),

    ...(kind === "GUIDE" && guideCategoryId
      ? { guideCategory: { connect: { id: guideCategoryId } } }
      : {}),

    ...(session.user?.id
      ? { author: { connect: { id: String(session.user.id) } } }
      : {}),

    ...(bannerAssetId
      ? { banner: { connect: { id: bannerAssetId } }, bannerUrl: null }
      : { bannerUrl }),

    ...(thumbnailAssetId
      ? { thumbnail: { connect: { id: thumbnailAssetId } }, thumbnailUrl: null }
      : { thumbnailUrl }),
  };

  const created = await prisma.page.create({
    data,
    select: { id: true, slug: true },
  });

  revalidatePath("/pages");
  revalidatePath(`/pages/${created.slug}`);
  revalidatePath("/admin/pages");

  return NextResponse.json({ ok: true, id: created.id, slug: created.slug });
}