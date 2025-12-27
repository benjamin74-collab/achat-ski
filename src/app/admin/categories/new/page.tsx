import { prisma } from "@/lib/prisma";
import NewCategoryForm from "../partials/NewCategoryForm";

export default async function NewCategoryPage() {
  const parents = await prisma.category.findMany({
    where: { published: true },
    select: { id: true, name: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nouvelle catégorie</h1>
      <NewCategoryForm parents={parents} />
    </div>
  );
}
