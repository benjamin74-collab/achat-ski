// src/app/admin/brands/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { sanitizeHtml } from "@/lib/sanitize";
import { revalidatePath } from "next/cache";

type FormBrand = {
  id?: string;
  name: string;
  slug?: string;
  websiteUrl?: string | null;

  // Fallback URLs (anciennes méthodes, on garde)
  logoUrl?: string | null;
  bannerUrl?: string | null;

  description?: string | null; // HTML
  active?: string | boolean; // "on" ou boolean

  // IDs MediaAsset (médiathèque)
  logoAssetId?: string | null;
  bannerAssetId?: string | null;

  // SEO
  metaTitle?: string | null;
  metaDescription?: string | null;
};

function boolFromInput(v: string | boolean | undefined) {
  if (typeof v === "boolean") return v;
  return v === "on" || v === "true";
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = (v as string | null) ?? null;
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function createBrand(form: FormData) {
  const data: FormBrand = {
    name: String(form.get("name") || "").trim(),
    slug: String(form.get("slug") || "").trim(),
    websiteUrl: (form.get("websiteUrl") as string) || null,

    logoUrl: (form.get("logoUrl") as string) || null,
    bannerUrl: (form.get("bannerUrl") as string) || null,

    description: (form.get("description") as string) || null,
    active: form.get("active") as string | undefined,

    logoAssetId: (form.get("logoAssetId") as string) || null,
    bannerAssetId: (form.get("bannerAssetId") as string) || null,

    metaTitle: (form.get("metaTitle") as string) || null,
    metaDescription: (form.get("metaDescription") as string) || null,
  };

  if (!data.name) throw new Error("Le nom de la marque est obligatoire.");
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);

  const logoId = numOrNull(data.logoAssetId ?? null);
  const bannerId = numOrNull(data.bannerAssetId ?? null);

  const brand = await prisma.brand.create({
    data: {
      name: data.name,
      slug,
      websiteUrl: data.websiteUrl || null,

      // Fallbacks
      logoUrl: data.logoUrl || null,
      bannerUrl: data.bannerUrl || null,

      // Relations vers MediaAsset (si fournis)
      ...(logoId ? { logoId } : {}),
      ...(bannerId ? { bannerId } : {}),

      description: data.description ? sanitizeHtml(data.description) : null,
      active: boolFromInput(data.active),

      // SEO
      metaTitle: data.metaTitle?.trim() || null,
      metaDescription: data.metaDescription?.trim() || null,
    },
    select: { slug: true },
  });

  revalidatePath("/admin/brands");
  revalidatePath("/marques");
  revalidatePath(`/marques/${brand.slug}`);
}

export async function updateBrand(id: number, form: FormData) {
  const data: FormBrand = {
    name: String(form.get("name") || "").trim(),
    slug: String(form.get("slug") || "").trim(),
    websiteUrl: (form.get("websiteUrl") as string) || null,

    logoUrl: (form.get("logoUrl") as string) || null,
    bannerUrl: (form.get("bannerUrl") as string) || null,

    description: (form.get("description") as string) || null,
    active: form.get("active") as string | undefined,

    logoAssetId: (form.get("logoAssetId") as string) || null,
    bannerAssetId: (form.get("bannerAssetId") as string) || null,

    metaTitle: (form.get("metaTitle") as string) || null,
    metaDescription: (form.get("metaDescription") as string) || null,
  };

  if (!data.name) throw new Error("Le nom de la marque est obligatoire.");
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);

  // Si champ vide => null => on ne touche pas (pas d’écrasement)
  // Si fourni => on set (y compris 0/NaN => null, mais on ignore)
  const logoId = numOrNull(data.logoAssetId ?? null);
  const bannerId = numOrNull(data.bannerAssetId ?? null);

  const brand = await prisma.brand.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      websiteUrl: data.websiteUrl || null,

      logoUrl: data.logoUrl || null,
      bannerUrl: data.bannerUrl || null,

      ...(data.logoAssetId != null
        ? { logoId: logoId ?? null }
        : {}),
      ...(data.bannerAssetId != null
        ? { bannerId: bannerId ?? null }
        : {}),

      description: data.description ? sanitizeHtml(data.description) : null,
      active: boolFromInput(data.active),

      metaTitle: data.metaTitle?.trim() || null,
      metaDescription: data.metaDescription?.trim() || null,
    },
    select: { slug: true },
  });

  revalidatePath("/admin/brands");
  revalidatePath("/marques");
  revalidatePath(`/marques/${brand.slug}`);
}

export async function deleteBrand(id: number) {
  await prisma.brand.delete({ where: { id } });
  revalidatePath("/admin/brands");
  revalidatePath("/marques");
}
