// src/app/api/admin/pages/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { revalidatePath } from "next/cache";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  const fd = await req.formData();
  const title = String(fd.get("title") || "");
  const slug = slugify(String(fd.get("slug") || title));

  const data = {
    title,
    slug,
    intro: (fd.get("intro") as string) || null,
    content: (fd.get("content") as string) || "",
    thumbnailUrl: (fd.get("thumbnailUrl") as string) || null,
    bannerUrl: (fd.get("bannerUrl") as string) || null,
    metaTitle: (fd.get("metaTitle") as string) || null,
    metaDescription: (fd.get("metaDescription") as string) || null,
    published: fd.get("published") === "on",
    tags: String(fd.get("tags") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };

  const p = await prisma.page.update({ where: { id }, data });
  revalidatePath("/pages");
  revalidatePath(`/pages/${p.slug}`);
  return NextResponse.json({ ok: true, slug: p.slug });
}
