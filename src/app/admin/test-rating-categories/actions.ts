// src/app/admin/test-rating-categories/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/slug";

function toInt(v: FormDataEntryValue | null, fallback = 0): number {
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

export async function createCategory(formData: FormData) {
  const label = String(formData.get("label") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const order = toInt(formData.get("order"), 0);

  if (!label) {
    throw new Error("Le libellé est obligatoire.");
  }

  const slug = rawSlug ? slugify(rawSlug) : slugify(label);

  await prisma.testRatingCategory.create({
    data: {
      label,
      slug,
      order,
    },
  });

  revalidatePath("/admin/test-rating-categories");
  revalidatePath("/admin/tests");
}

export async function updateCategory(formData: FormData) {
  const id = toInt(formData.get("id"), 0);
  if (!id) throw new Error("ID manquant pour la catégorie.");

  const label = String(formData.get("label") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const order = toInt(formData.get("order"), 0);

  if (!label) {
    throw new Error("Le libellé est obligatoire.");
  }

  const slug = rawSlug ? slugify(rawSlug) : slugify(label);

  await prisma.testRatingCategory.update({
    where: { id },
    data: {
      label,
      slug,
      order,
    },
  });

  revalidatePath("/admin/test-rating-categories");
  revalidatePath("/admin/tests");
}

export async function deleteCategory(formData: FormData) {
  const id = toInt(formData.get("id"), 0);
  if (!id) throw new Error("ID manquant pour la catégorie.");

  // ⚠️ Si des notes existent pour cette catégorie, la suppression peut échouer
  // selon la config de la FK (Restrict/Cascade). À ajuster côté schéma si besoin.
  await prisma.testRatingCategory.delete({
    where: { id },
  });

  revalidatePath("/admin/test-rating-categories");
  revalidatePath("/admin/tests");
}
