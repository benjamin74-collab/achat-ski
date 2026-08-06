// src/app/actions/category-enrichment.ts
"use server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CategoryEnrichmentMatchMode } from "@prisma/client";

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Accès non autorisé.");
  }

  return session;
}

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNullableNumber(formData: FormData, key: string): number | null {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} invalide.`);
  }

  return parsed;
}

function getRequiredNumber(formData: FormData, key: string): number {
  const parsed = getNullableNumber(formData, key);

  if (!parsed) {
    throw new Error(`${key} est obligatoire.`);
  }

  return parsed;
}

function getBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);

  return (
    value === "on" ||
    value === "true" ||
    value === "1" ||
    value === "yes"
  );
}

function splitTerms(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/\r?\n|,/)
        .map((term) => term.trim())
        .filter(Boolean)
    )
  );
}

function parseMatchMode(value: string): CategoryEnrichmentMatchMode {
  return value === "ALL" ? "ALL" : "ANY";
}

async function validateRuleScope(input: {
  siteId: string;
  feedSourceId: number | null;
  sourceCategoryId: number | null;
  targetCategoryId: number;
}) {
  const [feedSource, sourceCategory, targetCategory] =
    await Promise.all([
      input.feedSourceId
        ? prisma.feedSource.findUnique({
            where: {
              id: input.feedSourceId,
            },
            select: {
              id: true,
              siteId: true,
              active: true,
            },
          })
        : Promise.resolve(null),

      input.sourceCategoryId
        ? prisma.category.findUnique({
            where: {
              id: input.sourceCategoryId,
            },
            select: {
              id: true,
              published: true,
            },
          })
        : Promise.resolve(null),

      prisma.category.findUnique({
        where: {
          id: input.targetCategoryId,
        },
        select: {
          id: true,
          published: true,
        },
      }),
    ]);

  if (input.feedSourceId && !feedSource) {
    throw new Error("Flux introuvable.");
  }

  if (feedSource && feedSource.siteId !== input.siteId) {
    throw new Error("Le flux sélectionné n'appartient pas au site de la règle.");
  }

  if (input.sourceCategoryId && !sourceCategory) {
    throw new Error("Catégorie source introuvable.");
  }

  if (sourceCategory && !sourceCategory.published) {
    throw new Error("La catégorie source n'est pas publiée.");
  }

  if (!targetCategory) {
    throw new Error("Catégorie cible introuvable.");
  }

  if (!targetCategory.published) {
    throw new Error("La catégorie cible n'est pas publiée.");
  }
}

export async function upsertCategoryEnrichmentRule(formData: FormData) {
  await requireAdmin();

  const id = getNullableNumber(formData, "id");
  const siteId = getString(formData, "siteId") || "meilleur-ski";
  const name = getString(formData, "name");
  const feedSourceId = getNullableNumber(formData, "feedSourceId");
  const sourceCategoryId = getNullableNumber(formData, "sourceCategoryId");
  const targetCategoryId = getRequiredNumber(formData, "targetCategoryId");

  const includeTerms = splitTerms(getString(formData, "includeTerms"));
  const excludeTerms = splitTerms(getString(formData, "excludeTerms"));

  const matchMode = parseMatchMode(getString(formData, "matchMode"));
  const priority = Number(getString(formData, "priority") || "0");

  if (!name || name.length < 3) {
    throw new Error("Le nom de la règle doit contenir au moins 3 caractères.");
  }

  if (includeTerms.length === 0) {
    throw new Error("Ajoute au moins un terme d'inclusion.");
  }

  if (!Number.isInteger(priority)) {
    throw new Error("La priorité doit être un nombre entier.");
  }

  await validateRuleScope({
    siteId,
    feedSourceId,
    sourceCategoryId,
    targetCategoryId,
  });

  const data = {
    siteId,
    name,

    feedSourceId,
    sourceCategoryId,
    targetCategoryId,

    includeTerms,
    excludeTerms,

    matchMode,

    searchTitle: getBoolean(formData, "searchTitle"),
    searchDescription: getBoolean(formData, "searchDescription"),
    searchCategoryPath: getBoolean(formData, "searchCategoryPath"),
    searchBrand: getBoolean(formData, "searchBrand"),

    makePrimary: getBoolean(formData, "makePrimary"),
    active: getBoolean(formData, "active"),
    priority,
  };

  if (id) {
    await prisma.categoryEnrichmentRule.update({
      where: {
        id,
      },
      data,
    });
  } else {
    await prisma.categoryEnrichmentRule.create({
      data,
    });
  }

  revalidatePath("/admin/classification");
  revalidatePath("/admin/classification/new");

  redirect("/admin/classification");
}

export async function deleteCategoryEnrichmentRule(formData: FormData) {
  await requireAdmin();

  const id = getRequiredNumber(formData, "id");

  await prisma.categoryEnrichmentRule.delete({
    where: {
      id,
    },
  });

  revalidatePath("/admin/classification");
}

export async function toggleCategoryEnrichmentRule(formData: FormData) {
  await requireAdmin();

  const id = getRequiredNumber(formData, "id");
  const active = getBoolean(formData, "active");

  await prisma.categoryEnrichmentRule.update({
    where: {
      id,
    },
    data: {
      active,
    },
  });

  revalidatePath("/admin/classification");
}

export async function duplicateCategoryEnrichmentRule(formData: FormData) {
  await requireAdmin();

  const id = getRequiredNumber(formData, "id");

  const source = await prisma.categoryEnrichmentRule.findUnique({
    where: {
      id,
    },
  });

  if (!source) {
    throw new Error("Règle introuvable.");
  }

  await prisma.categoryEnrichmentRule.create({
    data: {
      siteId: source.siteId,
      name: `${source.name} — copie`,

      feedSourceId: source.feedSourceId,
      sourceCategoryId: source.sourceCategoryId,
      targetCategoryId: source.targetCategoryId,

      includeTerms: source.includeTerms,
      excludeTerms: source.excludeTerms,
      matchMode: source.matchMode,

      searchTitle: source.searchTitle,
      searchDescription: source.searchDescription,
      searchCategoryPath: source.searchCategoryPath,
      searchBrand: source.searchBrand,

      makePrimary: source.makePrimary,
      priority: source.priority,
      active: false,
    },
  });

  revalidatePath("/admin/classification");
}
