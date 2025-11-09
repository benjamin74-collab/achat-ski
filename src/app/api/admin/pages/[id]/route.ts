// src/app/api/admin/pages/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { revalidatePath } from "next/cache";
import { sanitizeHtml } from "@/lib/sanitize";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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
  const intro = (fd.get("intro") as string) || null;
  const contentRaw = (fd.get("content") as string) || "";
  const content = sanitizeHtml(contentRaw);

  // Fallback URLs (si aucun asset n’est choisi)
  const thumbnailUrl = ((fd.get("thumbnailUrl") as string) || "").trim() || null;
  const bannerUrl = ((fd.get("bannerUrl") as string) || "").trim() || null;

  // Ids d’assets (médiathèque)
  const thumbnailAssetIdRaw = fd.get("thumbnailAssetId");
  const bannerAssetIdRaw = fd.get("bannerAssetId");

  const thumbnailAssetId = thumbnailAssetIdRaw
    ? Number(String(thumbnailAssetIdRaw))
    : null;
  const bannerAssetId = bannerAssetIdRaw
    ? Number(String(bannerAssetIdRaw))
    : null;

  // Meta + statut + tags
  const metaTitle = ((fd.get("metaTitle") as string) || "").trim() || null;
  const metaDescription =
    ((fd.get("metaDescription") as string) || "").trim() || null;
  const published = fd.get("published") === "on";
  const tags = String(fd.get("tags") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Construction du payload en combinant relations + fallbacks URL
  const data: any = {
    title,
    slug,
    intro,
    content,
    metaTitle,
    metaDescription,
    published,
    tags,
  };

  // Bannière : si on a un asset, on le connecte et on met l’URL à null
  // sinon on disconnect la relation et on garde l’URL si fournie
  if (bannerAssetId) {
    data.banner = { connect: { id: bannerAssetId } };
    data.bannerUrl = null;
  } else {
    data.banner = { disconnect: true };
    data.bannerUrl = bannerUrl;
  }

  // Miniature : même logique
  if (thumbnailAssetId) {
    data.thumbnail = { connect: { id: thumbnailAssetId } };
    data.thumbnailUrl = null;
  } else {
    data.thumbnail = { disconnect: true };
    data.thumbnailUrl = thumbnailUrl;
  }

  await prisma.page.update({
    where: { id },
    data,
  });

  revalidatePath("/pages");
  revalidatePath(`/pages/${slug}`);

  return NextResponse.json({ ok: true, slug });
}
