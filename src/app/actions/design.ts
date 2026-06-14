"use server";

import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/config/site";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

type Json = Prisma.JsonValue;

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function asJson(v: unknown): Json | null {
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;

    try {
      return JSON.parse(s) as Json;
    } catch {
      return s as unknown as Json;
    }
  }

  if (v === null || v === undefined) return null;
  if (typeof v === "object") return v as Json;
  if (typeof v === "number" || typeof v === "boolean") return v as Json;

  return null;
}

function formDataToObject(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [k, v] of formData.entries()) {
    out[k] = typeof v === "string" ? v : v.name;
  }

  return out;
}

function getAllStrings(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((v) => (typeof v === "string" ? v : ""))
    .filter(Boolean);
}

function numberFromRaw(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function saveDesign(formData: FormData) {
  const siteConfig = getSiteConfig();
  const siteId = siteConfig.id;

  const raw = formDataToObject(formData);

  const name = asString(raw.name, siteConfig.name);
  const tagline = asString(raw.tagline);
  const logoSrc = asString(raw.logoSrc);
  const logoAlt = asString(raw.logoAlt, siteConfig.name);
  const faviconSrc = asString(raw.faviconSrc);

  const primary = asString(raw.primary);
  const secondary = asString(raw.secondary);
  const accent = asString(raw.accent);
  const background = asString(raw.background);
  const foreground = asString(raw.foreground);
  const muted = asString(raw.muted);
  const mutedForeground = asString(raw.mutedForeground);
  const border = asString(raw.border);

  const fontSans = asString(raw.fontSans);
  const fontDisplay = asString(raw.fontDisplay);

  const heroTitle = asString(raw.heroTitle);
  const heroHighlight = asString(raw.heroHighlight);
  const heroSubtitle = asString(raw.heroSubtitle);

  const showCategories = asBool(
    raw.showCategories === "on" || raw.showCategories === "true",
    true,
  );

  const showLatestGuides = asBool(
    raw.showLatestGuides === "on" || raw.showLatestGuides === "true",
    true,
  );

  const showTopBrands = asBool(
    raw.showTopBrands === "on" || raw.showTopBrands === "true",
    true,
  );

  const robotsIndex = raw.robotsIndex === "on" || raw.robotsIndex === "true";
  const robotsFollow = raw.robotsFollow === "on" || raw.robotsFollow === "true";
  const robotsNoarchive = raw.robotsNoarchive === "on" || raw.robotsNoarchive === "true";

  const heroCtas = asJson(raw.heroCtas);

  const selectedCategorySlugs = getAllStrings(formData, "homeCategorySlugs");
  const selectedBrandSlugs = getAllStrings(formData, "homeBrandSlugs");

  const categoryTiles = selectedCategorySlugs
    .map((slug, index) => ({
      slug,
      title: asString(raw[`homeCategoryTitle_${slug}`], slug),
      desc: asString(raw[`homeCategoryDesc_${slug}`]),
      cta: asString(raw[`homeCategoryCta_${slug}`], "Comparer les prix"),
      img: asString(raw[`homeCategoryImg_${slug}`]),
      order: numberFromRaw(raw[`homeCategoryOrder_${slug}`], index + 1),
    }))
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...item }) => item);

  const brandsFromDb = await prisma.brand.findMany({
    where: { slug: { in: selectedBrandSlugs } },
    select: {
      name: true,
      slug: true,
      logoUrl: true,
      logo: { select: { publicUrl: true } },
    },
  });

  const topBrands = selectedBrandSlugs
    .map((slug, index) => {
      const b = brandsFromDb.find((x) => x.slug === slug);

      return {
        name: b?.name ?? slug,
        slug,
        logo: asString(raw[`homeBrandLogo_${slug}`], b?.logo?.publicUrl ?? b?.logoUrl ?? ""),
        order: numberFromRaw(raw[`homeBrandOrder_${slug}`], index + 1),
      };
    })
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...item }) => item);

  await prisma.siteSettings.upsert({
    where: { siteId },
    create: {
      siteId,
      name,
      tagline,
      logoSrc,
      logoAlt,
      faviconSrc: faviconSrc || null,

      robotsIndex,
      robotsFollow,
      robotsNoarchive,

      primary,
      secondary,
      accent,
      background,
      foreground,
      muted,
      mutedForeground,
      border,

      fontSans,
      fontDisplay,

      heroTitle: heroTitle || null,
      heroHighlight: heroHighlight || null,
      heroSubtitle: heroSubtitle || null,
      heroCtas: heroCtas ?? undefined,

      showCategories,
      showLatestGuides,
      showTopBrands,

      categoryTiles,
      topBrands,

      updatedAt: new Date(),
    },
    update: {
      name,
      tagline,
      logoSrc,
      logoAlt,
      faviconSrc: faviconSrc || null,

      robotsIndex,
      robotsFollow,
      robotsNoarchive,

      primary,
      secondary,
      accent,
      background,
      foreground,
      muted,
      mutedForeground,
      border,

      fontSans,
      fontDisplay,

      heroTitle: heroTitle || null,
      heroHighlight: heroHighlight || null,
      heroSubtitle: heroSubtitle || null,
      heroCtas: heroCtas ?? undefined,

      showCategories,
      showLatestGuides,
      showTopBrands,

      categoryTiles,
      topBrands,

      updatedAt: new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/design");
}