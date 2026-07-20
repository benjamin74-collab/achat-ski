"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentSiteId } from "@/lib/currentSite";
import { resolveBrandsContent } from "@/lib/siteContent";

function getString(
  formData: FormData,
  key: string,
  fallback = "",
): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : fallback;
}

function getParagraphs(
  formData: FormData,
  key: string,
): string[] {
  const value = getString(formData, key);

  return value
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export async function saveContentSettings(formData: FormData) {
  const siteId = await getCurrentSiteId();

  const existingSettings = await prisma.siteSettings.findUnique({
    where: { siteId },
    select: {
      contentSettings: true,
    },
  });

  const currentBrands = resolveBrandsContent(
    existingSettings?.contentSettings,
  );

  const brands = {
    eyebrow: getString(
      formData,
      "brandsEyebrow",
      currentBrands.eyebrow,
    ),
    title: getString(
      formData,
      "brandsTitle",
      currentBrands.title,
    ),
    description: getString(
      formData,
      "brandsDescription",
      currentBrands.description,
    ),

    searchLabel: getString(
      formData,
      "brandsSearchLabel",
      currentBrands.searchLabel,
    ),
    searchPlaceholder: getString(
      formData,
      "brandsSearchPlaceholder",
      currentBrands.searchPlaceholder,
    ),

    resultSingular: getString(
      formData,
      "brandsResultSingular",
      currentBrands.resultSingular,
    ),
    resultPlural: getString(
      formData,
      "brandsResultPlural",
      currentBrands.resultPlural,
    ),
    displayedSingular: getString(
      formData,
      "brandsDisplayedSingular",
      currentBrands.displayedSingular,
    ),
    displayedPlural: getString(
      formData,
      "brandsDisplayedPlural",
      currentBrands.displayedPlural,
    ),

    popularTitle: getString(
      formData,
      "brandsPopularTitle",
      currentBrands.popularTitle,
    ),
    popularDescription: getString(
      formData,
      "brandsPopularDescription",
      currentBrands.popularDescription,
    ),

    emptyTitle: getString(
      formData,
      "brandsEmptyTitle",
      currentBrands.emptyTitle,
    ),
    emptyDescription: getString(
      formData,
      "brandsEmptyDescription",
      currentBrands.emptyDescription,
    ),

    seoTitle: getString(
      formData,
      "brandsSeoTitle",
      currentBrands.seoTitle,
    ),
    seoParagraphs: getParagraphs(
      formData,
      "brandsSeoParagraphs",
    ),

    cardCta: getString(
      formData,
      "brandsCardCta",
      currentBrands.cardCta,
    ),
    itemListName: getString(
      formData,
      "brandsItemListName",
      currentBrands.itemListName,
    ),

    breadcrumbHomeLabel: getString(
      formData,
      "brandsBreadcrumbHomeLabel",
      currentBrands.breadcrumbHomeLabel,
    ),
    breadcrumbBrandsLabel: getString(
      formData,
      "brandsBreadcrumbBrandsLabel",
      currentBrands.breadcrumbBrandsLabel,
    ),
  };

  const currentContent =
    existingSettings?.contentSettings &&
    typeof existingSettings.contentSettings === "object" &&
    !Array.isArray(existingSettings.contentSettings)
      ? existingSettings.contentSettings
      : {};

  const contentSettings = {
    ...(currentContent as Record<string, unknown>),
    brands,
  } satisfies Prisma.InputJsonObject;

  await prisma.siteSettings.update({
    where: { siteId },
    data: {
      contentSettings,
    },
  });

  revalidatePath("/admin/content");
  revalidatePath("/marques");
}