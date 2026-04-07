// src/app/admin/guide-categories/new/page.tsx
import GuideCategoryForm from "../partials/GuideCategoryForm";

export default function NewGuideCategoryPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Nouvelle catégorie de guide</h1>
      <GuideCategoryForm />
    </div>
  );
}