"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updateCategoryMappingAction(
  formData: FormData
): Promise<void> {
  const feedId = parsePositiveInteger(
    formData.get("feedId")
  );

  const mappingId = parsePositiveInteger(
    formData.get("mappingId")
  );

  const categoryId = parsePositiveInteger(
    formData.get("categoryId")
  );

  if (!feedId || !mappingId || !categoryId) {
    throw new Error(
      "Informations de mapping invalides."
    );
  }

  const mapping =
    await prisma.categoryExternalMapping.findFirst({
      where: {
        id: mappingId,
        feedSourceId: feedId,
      },
      select: {
        id: true,
      },
    });

  if (!mapping) {
    throw new Error(
      "Le mapping demandé n’existe pas."
    );
  }

  const priority =
    parseInteger(formData.get("priority")) ?? 0;

  const active =
    formData.get("active") === "on";

  await prisma.categoryExternalMapping.update({
    where: {
      id: mappingId,
    },
    data: {
      categoryId,
      priority,
      active,
    },
  });

  revalidateFeedPages(feedId);
}

export async function createCategoryMappingAction(
  formData: FormData
): Promise<void> {
  const feedId = parsePositiveInteger(
    formData.get("feedId")
  );

  const categoryId = parsePositiveInteger(
    formData.get("categoryId")
  );

  const externalPath = getString(
    formData.get("externalPath")
  );

  if (!feedId || !categoryId) {
    throw new Error(
      "Le flux ou la catégorie est invalide."
    );
  }

  if (!externalPath) {
    throw new Error(
      "Le chemin externe est obligatoire."
    );
  }

  const normalizedExternalPath =
    normalizeCategoryPath(externalPath);

  if (!normalizedExternalPath) {
    throw new Error(
      "Le chemin externe ne peut pas être normalisé."
    );
  }

  const priority =
    parseInteger(formData.get("priority")) ?? 0;

  const existing =
    await prisma.categoryExternalMapping.findFirst({
      where: {
        feedSourceId: feedId,
        categoryId,
        normalizedExternalPath,
      },
      select: {
        id: true,
      },
    });

  if (existing) {
    await prisma.categoryExternalMapping.update({
      where: {
        id: existing.id,
      },
      data: {
        externalPath,
        priority,
        active: true,
      },
    });
  } else {
    await prisma.categoryExternalMapping.create({
      data: {
        feedSourceId: feedId,
        categoryId,
        externalPath,
        normalizedExternalPath,
        priority,
        active: true,
      },
    });
  }

  revalidateFeedPages(feedId);
}

function revalidateFeedPages(
  feedId: number
): void {
  revalidatePath(`/admin/feeds/${feedId}`);
  revalidatePath(
    `/admin/feeds/${feedId}/categories`
  );
}

function normalizeCategoryPath(
  value: string
): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00a0/g, " ")
    .toLowerCase()
    .replace(
      /\s*(>|\/|\||»|→)\s*/g,
      " > "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function parsePositiveInteger(
  value: FormDataEntryValue | null
): number | null {
  const parsed = Number(value);

  return Number.isInteger(parsed) &&
    parsed > 0
    ? parsed
    : null;
}

function parseInteger(
  value: FormDataEntryValue | null
): number | null {
  const parsed = Number(value);

  return Number.isInteger(parsed)
    ? parsed
    : null;
}

function getString(
  value: FormDataEntryValue | null
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}