// src/app/api/admin/pages/route.ts
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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    // On stocke du HTML sanitisé côté serveur
    content: sanitizeHtml((fd.get("content") as string) || ""),
    // Fallbacks URL si pas d’asset
    thumbnailUrl: ((fd.get("thumbnailUrl") as string) || "").trim() || null,
    bannerUrl: ((fd.get("bannerUrl") as string) || "").trim() || null,
    metaTitle: (fd.get("metaTitle") as string) || null,
    metaDescription: (fd.get("metaDescription") as string) || null,
    published: fd.get("published") === "on",
    // User.id est un String (cuid)
    authorId: session.user?.id ? String(session.user.id) : null,
    tags: String(fd.get("tags") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    // Champs médiathèque (optionnels)
    ...(thumbnailAssetId !== null ? { thumbnailAssetId } : {}),
    ...(bannerAssetId !== null ? { bannerAssetId } : {}),
  };

  await prisma.page.create({ data });

  // Revalidate admin + public
  revalidatePath("/admin/pages");
  revalidatePath("/pages");
  revalidatePath(`/pages/${slug}`);

  return NextResponse.json({ ok: true, slug });
}
