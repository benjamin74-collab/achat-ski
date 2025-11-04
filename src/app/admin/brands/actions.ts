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
  logoUrl?: string | null;
  description?: string | null; // HTML
  active?: string | boolean;   // "on" ou boolean
};

function boolFromInput(v: string | boolean | undefined) {
  if (typeof v === "boolean") return v;
  return v === "on" || v === "true";
}

export async function createBrand(form: FormData) {
  const data: FormBrand = {
    name: String(form.get("name") || "").trim(),
    slug: String(form.get("slug") || "").trim(),
    websiteUrl: (form.get("websiteUrl") as string) || null,
    logoUrl: (form.get("logoUrl") as string) || null,
    description: (form.get("description") as string) || null,
    active: form.get("active") as string | undefined
  };

  if (!data.name) throw new Error("Le nom de la marque est obligatoire.");
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);

  const brand = await prisma.brand.create({
    data: {
      name: data.name,
      slug,
      websiteUrl: data.websiteUrl || null,
      logoUrl: data.logoUrl || null,
      description: data.description ? sanitizeHtml(data.description) : null,
      active: boolFromInput(data.active),
    },
  });

  // Revalidation : admin + public
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
    active: form.get("active") as string | undefined
  };

  if (!data.name) throw new Error("Le nom de la marque est obligatoire.");
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);

  const brand = await prisma.brand.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      websiteUrl: data.websiteUrl || null,
      logoUrl: data.logoUrl || null,
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
