// src/app/actions/categories.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const featuredIdsSchema = z
  .union([z.array(z.coerce.number()), z.coerce.number(), z.string(), z.undefined()])
  .transform((v) => {
    if (v === undefined) return [];
    if (Array.isArray(v)) return v.map(Number).filter((n) => Number.isFinite(n) && n > 0);
    if (typeof v === "string") {
      return v.split(",").map((x) => Number(x.trim())).filter((n) => Number.isFinite(n) && n > 0);
    }
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? [n] : [];
  });

const schema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  intro: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  thumbnailUrl: z.string().optional().nullable(),
  published: z.boolean().optional().default(true),
  parentId: z.union([z.string(), z.number(), z.null(), z.undefined()]).transform((v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isNaN(n)) throw new Error("parentId invalide");
    return n;
  }).optional(),
  isInMenu: z.boolean().optional().default(true),
  order: z.coerce.number().optional().default(0),
  mapKwanko: z.union([z.array(z.string()), z.string(), z.undefined()]).transform((v) => (typeof v === "string" ? splitLines(v) : v ?? [])),
  mapEkosport: z.union([z.array(z.string()), z.string(), z.undefined()]).transform((v) => (typeof v === "string" ? splitLines(v) : v ?? [])),
  mapSnowleader: z.union([z.array(z.string()), z.string(), z.undefined()]).transform((v) => (typeof v === "string" ? splitLines(v) : v ?? [])),
  mapGlisshop: z.union([z.array(z.string()), z.string(), z.undefined()]).transform((v) => (typeof v === "string" ? splitLines(v) : v ?? [])),
  aliases: z.union([z.array(z.string()), z.string(), z.undefined()]).transform((v) => (typeof v === "string" ? splitLines(v) : v ?? [])),
  featuredGuideIds: featuredIdsSchema.optional().default([]),
  featuredBrandIds: featuredIdsSchema.optional().default([]),
});

function splitLines(s: string) { return s.split("\n").map((x) => x.trim()).filter(Boolean); }
function uniqueIds(ids: number[]) { return Array.from(new Set(ids.filter((n) => Number.isFinite(n) && n > 0))); }

export type UpsertCategoryInput = z.input<typeof schema>;

export async function upsertCategory(input: UpsertCategoryInput) {
  const data = schema.parse(input);
  const payload = {
    name: data.name, intro: data.intro ?? null, content: data.content ?? null,
    metaTitle: data.metaTitle ?? null, metaDescription: data.metaDescription ?? null,
    thumbnailUrl: data.thumbnailUrl ?? null, published: data.published ?? true,
    parentId: data.parentId ?? null, isInMenu: data.isInMenu ?? true, order: data.order ?? 0,
    mapKwanko: data.mapKwanko ?? [], mapEkosport: data.mapEkosport ?? [],
    mapSnowleader: data.mapSnowleader ?? [], mapGlisshop: data.mapGlisshop ?? [], aliases: data.aliases ?? [],
  };
  const guideIds = uniqueIds(data.featuredGuideIds ?? []).slice(0, 4);
  const brandIds = uniqueIds(data.featuredBrandIds ?? []).slice(0, 8);

  await prisma.$transaction(async (tx) => {
    const category = await tx.category.upsert({
      where: { slug: data.slug },
      create: { slug: data.slug, ...payload },
      update: payload,
      select: { id: true },
    });

    await tx.categoryFeaturedLink.deleteMany({ where: { categoryId: category.id } });

    if (guideIds.length) {
      await tx.categoryFeaturedLink.createMany({
        data: guideIds.map((pageId, index) => ({ categoryId: category.id, type: "GUIDE", pageId, order: index + 1 })),
      });
    }
    if (brandIds.length) {
      await tx.categoryFeaturedLink.createMany({
        data: brandIds.map((brandId, index) => ({ categoryId: category.id, type: "BRAND", brandId, order: index + 1 })),
      });
    }
  });

  revalidatePath("/"); revalidatePath("/admin/categories"); revalidatePath("/categories");
  revalidatePath(`/${data.slug}`); revalidatePath(`/c/${data.slug}`);
}

export async function deleteCategory(slug: string) {
  await prisma.category.delete({ where: { slug } });
  revalidatePath("/"); revalidatePath("/admin/categories"); revalidatePath("/categories"); revalidatePath(`/${slug}`); revalidatePath(`/c/${slug}`);
}

export async function toggleCategoryHomepage(slug: string, value: boolean) {
  await prisma.category.update({ where: { slug }, data: { showOnHomepage: value } });
  revalidatePath("/"); revalidatePath("/admin/categories");
}
