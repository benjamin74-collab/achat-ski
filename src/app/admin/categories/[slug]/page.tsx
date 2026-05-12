// src/app/admin/categories/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import EditCategoryForm from "../partials/EditCategoryForm";

type PageParams = { slug: string };

export default async function EditCategoryPage({ params }: { params: Promise<PageParams> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") return notFound();

  const { slug } = await params;

  const [cat, parents] = await Promise.all([
    prisma.category.findUnique({
      where: { slug },
      select: {
        id: true, slug: true, name: true,
        intro: true, content: true,
        metaTitle: true, metaDescription: true, thumbnailUrl: true,
        parentId: true, isInMenu: true, order: true, published: true,
        mapKwanko: true, mapEkosport: true, mapSnowleader: true, mapGlisshop: true, aliases: true,
      },
    }),
    prisma.category.findMany({
      where: { slug: { not: slug } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!cat) return notFound();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Modifier la catégorie</h1>
      <EditCategoryForm initial={cat} parents={parents} />
    </div>
  );
}
