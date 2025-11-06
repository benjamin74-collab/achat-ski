// src/app/api/admin/pages/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    // 🔧 User.id est un String (cuid)
    authorId: session.user?.id ? String(session.user.id) : null,
    tags: String(fd.get("tags") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };

  await prisma.page.create({ data });
  revalidatePath("/pages");
  revalidatePath(`/pages/${slug}`);
  return NextResponse.json({ ok: true, slug });
}
