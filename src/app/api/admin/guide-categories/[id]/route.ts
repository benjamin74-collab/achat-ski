// src/app/api/admin/guide-categories/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

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
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
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
    const updated = await prisma.guideCategory.update({
      where: { id },
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
    revalidatePath(`/admin/guide-categories/${id}/edit`);
    revalidatePath("/pages");

    return NextResponse.json({ ok: true, id: updated.id, slug: updated.slug });
  } catch (error) {
    return NextResponse.json(
      { error: "Impossible de modifier la catégorie. Vérifie que le nom et le slug sont uniques." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const category = await prisma.guideCategory.findUnique({
    where: { id },
    select: {
      id: true,
      _count: {
        select: {
          pages: true,
        },
      },
    },
  });

  if (!category) {
    return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 });
  }

  if (category._count.pages > 0) {
    return NextResponse.json(
      { error: "Impossible de supprimer une catégorie encore liée à des pages." },
      { status: 400 }
    );
  }

  await prisma.guideCategory.delete({
    where: { id },
  });

  revalidatePath("/admin/guide-categories");
  revalidatePath("/pages");

  return NextResponse.json({ ok: true });
}