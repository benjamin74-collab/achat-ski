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
  logoUrl?: string | null;      // fallback URL
  description?: string | null;  // HTML
  active?: string | boolean;    // "on" ou boolean
  logoAssetId?: string | null;  // id du média (string à convertir)
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
    description: (form.get("description") as string) || null,
    active: form.get("active") as string | undefined,
    logoAssetId: (form.get("logoAssetId") as string) || null,
  };

  if (!data.name) throw new Error("Le nom de la marque est obligatoire.");
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  const logoAssetId = numOrNull(data.logoAssetId ?? null);

  const brand = await prisma.brand.create({
    data: {
      name: data.name,
      slug,
      websiteUrl: data.websiteUrl || null,
      logoUrl: data.logoUrl || null, // garde le fallback
      // ⚠️ nécessite les champs dans le schéma :
      //   logoAssetId Int? ; logoAsset MediaAsset? @relation(fields: [logoAssetId], references: [id])
      ...(logoAssetId ? { logoAssetId } : {}),
      description: data.description ? sanitizeHtml(data.description) : null,
      active: boolFromInput(data.active),
    },
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
    description: (form.get("description") as string) || null,
    active: form.get("active") as string | undefined,
    logoAssetId: (form.get("logoAssetId") as string) || null,
  };

  if (!data.name) throw new Error("Le nom de la marque est obligatoire.");
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  const logoAssetId = numOrNull(data.logoAssetId ?? null);

  const brand = await prisma.brand.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      websiteUrl: data.websiteUrl || null,
      logoUrl: data.logoUrl || null, // garde le fallback
      ...(logoAssetId !== null ? { logoAssetId } : {}), // si vide, on n’écrase pas
      description: data.description ? sanitizeHtml(data.description) : null,
      active: boolFromInput(data.active),
    },
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
