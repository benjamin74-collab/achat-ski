// src/app/api/admin/pages/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { revalidatePath } from "next/cache";
import { sanitizeHtml } from "@/lib/sanitize";

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = (v as string | null) ?? null;
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const fd = await req.formData();
  const title = String(fd.get("title") || "");
  const slug = slugify(String(fd.get("slug") || title));

  const thumbnailAssetId = numOrNull(fd.get("thumbnailAssetId"));
  const bannerAssetId = numOrNull(fd.get("bannerAssetId"));

  const data = {
    title,
    slug,
    intro: (fd.get("intro") as string) || null,
    content: sanitizeHtml((fd.get("content") as string) || ""),
    thumbnailUrl: ((fd.get("thumbnailUrl") as string) || "").trim() || null,
    bannerUrl: ((fd.get("bannerUrl") as string) || "").trim() || null,
    metaTitle: (fd.get("metaTitle") as string) || null,
    metaDescription: (fd.get("metaDescription") as string) || null,
    published: fd.get("published") === "on",
    tags: String(fd.get("tags") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    // champs asset optionnels (on n’écrase pas si null)
    ...(thumbnailAssetId !== null ? { thumbnailAssetId } : {}),
    ...(bannerAssetId !== null ? { bannerAssetId } : {}),
  };

  const updated = await prisma.page.update({ where: { id }, data });

  revalidatePath("/admin/pages");
  revalidatePath("/pages");
  revalidatePath(`/pages/${updated.slug}`);

  return NextResponse.json({ ok: true, slug: updated.slug });
}
