// src/app/actions/categories.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/** ---- Validation & normalisation ---- */
const schema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),

  intro: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),

  published: z.boolean().optional().default(true),

  // Parent arrive souvent en string depuis le form; on convertit → number|null
  parentId: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === null || v === undefined || v === "") return null;
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isNaN(n)) throw new Error("parentId invalide");
      return n;
    })
    .optional(),

  isInMenu: z.boolean().optional().default(true),
  order: z.coerce.number().optional().default(0),

  // Autoriser string (textarea non transformée) ou string[]
  mapKwanko: z
    .union([z.array(z.string()), z.string(), z.undefined()])
    .transform((v) => (typeof v === "string" ? splitLines(v) : v ?? [])),
  mapEkosport: z
    .union([z.array(z.string()), z.string(), z.undefined()])
    .transform((v) => (typeof v === "string" ? splitLines(v) : v ?? [])),
  mapSnowleader: z
    .union([z.array(z.string()), z.string(), z.undefined()])
    .transform((v) => (typeof v === "string" ? splitLines(v) : v ?? [])),
  mapGlisshop: z
    .union([z.array(z.string()), z.string(), z.undefined()])
    .transform((v) => (typeof v === "string" ? splitLines(v) : v ?? [])),
  aliases: z
    .union([z.array(z.string()), z.string(), z.undefined()])
    .transform((v) => (typeof v === "string" ? splitLines(v) : v ?? [])),
});

function splitLines(s: string) {
  return s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

/** ---- Types exportés côté client si besoin ---- */
export type UpsertCategoryInput = z.input<typeof schema>;

/** ---- Upsert catégorie (create/update par slug) ---- */
export async function upsertCategory(input: UpsertCategoryInput) {
  const data = schema.parse(input);

  // Payload commun
  const payload = {
    name: data.name,
    intro: data.intro ?? null,
    content: data.content ?? null,
    metaTitle: data.metaTitle ?? null,
    metaDescription: data.metaDescription ?? null,
    published: data.published ?? true,
    parentId: data.parentId ?? null,
    isInMenu: data.isInMenu ?? true,
    order: data.order ?? 0,
    mapKwanko: data.mapKwanko ?? [],
    mapEkosport: data.mapEkosport ?? [],
    mapSnowleader: data.mapSnowleader ?? [],
    mapGlisshop: data.mapGlisshop ?? [],
    aliases: data.aliases ?? [],
  };

  await prisma.category.upsert({
    where: { slug: data.slug },
    create: { slug: data.slug, ...payload },
    update: payload,
  });

  // Revalidation BO + public
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath(`/c/${data.slug}`);
}

/** ---- Suppression par slug ----
 * Grâce aux relations ON DELETE SET NULL (produits) et SetNull (hiérarchie),
 * la suppression ne casse pas les FKs : les enfants deviennent orphelins
 * (parentId = null) et les produits rattachés voient categoryId = null.
 */
export async function deleteCategory(slug: string) {
  await prisma.category.delete({ where: { slug } });

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath(`/c/${slug}`);
}

export async function toggleCategoryHomepage(slug: string, value: boolean) {
  await prisma.category.update({
    where: { slug },
    data: { showOnHomepage: value },
  });

  revalidatePath("/");
  revalidatePath("/admin/categories");
}