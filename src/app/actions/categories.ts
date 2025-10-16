// src/app/actions/categories.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type UpsertCategoryInput = {
  slug: string;
  name: string;
  intro?: string;
  content?: string;
  metaTitle?: string;
  metaDescription?: string;
  published?: boolean;
};

export async function upsertCategory(input: UpsertCategoryInput) {
  await prisma.category.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      name: input.name,
      intro: input.intro ?? "",
      content: input.content ?? "",
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      published: input.published ?? true,
    },
    update: {
      name: input.name,
      intro: input.intro ?? "",
      content: input.content ?? "",
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      published: input.published ?? true,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath(`/c/${input.slug}`);
}

export async function deleteCategory(slug: string) {
  await prisma.category.delete({ where: { slug } });
  revalidatePath("/admin/categories");
  revalidatePath(`/c/${slug}`);
}
