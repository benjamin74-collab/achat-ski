// src/app/admin/pages/new/page.tsx
import { prisma } from "@/lib/prisma";
import PageForm from "../_PageForm";

export default async function NewPage() {
  const guideCategories = await prisma.guideCategory.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Nouvelle page</h1>
      <PageForm guideCategories={guideCategories} />
    </div>
  );
}