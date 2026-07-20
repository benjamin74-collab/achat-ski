"use server";

import { LegalPageType } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentSiteId } from "@/lib/currentSite";
import { getLegalPageDefinitionByType } from "@/lib/legalPages";

function getOptionalString(formData: FormData, field: string): string | null {
  const value = formData.get(field);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function getRequiredString(formData: FormData, field: string): string {
  const value = formData.get(field);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Le champ "${field}" est obligatoire.`);
  }

  return value.trim();
}

function parseLegalPageType(value: FormDataEntryValue | null): LegalPageType {
  if (
    typeof value !== "string" ||
    !Object.values(LegalPageType).includes(value as LegalPageType)
  ) {
    throw new Error("Type de page légale invalide.");
  }

  return value as LegalPageType;
}

export async function saveLegalPageAction(formData: FormData) {
  const siteId = await getCurrentSiteId();

  const type = parseLegalPageType(formData.get("type"));
  const title = getRequiredString(formData, "title");
  const content = getRequiredString(formData, "content");

  const metaTitle = getOptionalString(formData, "metaTitle");
  const metaDescription = getOptionalString(formData, "metaDescription");
  const version = getOptionalString(formData, "version");

  const effectiveDateValue = getOptionalString(formData, "effectiveDate");

  const effectiveDate = effectiveDateValue
    ? new Date(`${effectiveDateValue}T00:00:00.000Z`)
    : null;

  if (effectiveDate && Number.isNaN(effectiveDate.getTime())) {
    throw new Error("La date d’entrée en vigueur est invalide.");
  }

  const published = formData.get("published") === "on";

  await prisma.legalPage.upsert({
    where: {
      siteId_type: {
        siteId,
        type,
      },
    },
    create: {
      siteId,
      type,
      title,
      content,
      metaTitle,
      metaDescription,
      version,
      effectiveDate,
      published,
    },
    update: {
      title,
      content,
      metaTitle,
      metaDescription,
      version,
      effectiveDate,
      published,
    },
  });

  const definition = getLegalPageDefinitionByType(type);

  revalidatePath("/admin/legal-pages");

  if (definition) {
    revalidatePath(definition.publicPath);
  }

  redirect("/admin/legal-pages");
}