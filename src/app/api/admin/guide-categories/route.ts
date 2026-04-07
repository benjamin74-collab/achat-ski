// src/app/api/admin/guide-categories/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fd = await req.formData();

  const name = String(fd.get("name") || "").trim();
  const slug = slugify(String(fd.get("slug") || name));
  const description = String(fd.get("description") || "").trim() || null;
  const order = Number(fd.get("order") || 0);
  const isInMenu = fd.get("isInMenu") === "on";
  const active = fd.get("active") === "on";

  if (!name) {
    return NextResponse.json({ error: "Le nom est obligatoire" }, { status: 400 });
  }

  try {
    const created = await prisma.guideCategory.create({
      data: {
        name,
        slug,
        description,
        order: Number.isFinite(order) ? order : 0,
        isInMenu,
        active,
      },
      select: { id: true, slug: true },
    });

    revalidatePath("/admin/guide-categories");
    revalidatePath("/pages");

    return NextResponse.json({ ok: true, id: created.id, slug: created.slug });
  } catch (error) {
    return NextResponse.json(
      { error: "Impossible de créer la catégorie. Vérifie que le nom et le slug sont uniques." },
      { status: 400 }
    );
  }
}