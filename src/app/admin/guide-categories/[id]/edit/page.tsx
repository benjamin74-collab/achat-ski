// src/app/admin/guide-categories/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GuideCategoryForm from "../../partials/GuideCategoryForm";

export default async function EditGuideCategoryPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);

  if (!Number.isFinite(id)) return notFound();

  const category = await prisma.guideCategory.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      order: true,
      isInMenu: true,
      active: true,
    },
  });

  if (!category) return notFound();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Modifier la catégorie de guide</h1>
      <GuideCategoryForm initial={category} />
    </div>
  );
}