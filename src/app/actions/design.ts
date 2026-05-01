// src/app/actions/design.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/config/site";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

type Json = Prisma.JsonValue;
type JsonObj = Record<string, Json>;

function isJsonObject(v: Json): v is JsonObj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function asJson(v: unknown): Json | null {
  // On stocke du JSONB en DB. On accepte:
  // - string JSON ("[...]"/"{...}")
  // - objet/array direct (rare côté FormData)
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    try {
      return JSON.parse(s) as Json;
    } catch {
      // si ce n'est pas du JSON valide, on garde en string
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
    // FormDataEntryValue = string | File
    out[k] = typeof v === "string" ? v : v.name;
  }
  return out;
}

export async function saveDesign(formData: FormData) {
  const siteConfig = getSiteConfig();
  const siteId = siteConfig.id;

  const raw = formDataToObject(formData);

  // champs texte
  const name = asString(raw.name, siteConfig.name);
  const tagline = asString(raw.tagline, "");
  const logoSrc = asString(raw.logoSrc, siteConfig.brand.logoSrc);
  const logoAlt = asString(raw.logoAlt, siteConfig.brand.logoAlt);
  const faviconSrc = asString(raw.faviconSrc, siteConfig.brand.faviconSrc ?? "");

  // couleurs
  const primary = asString(raw.primary, siteConfig.colors.primary);
  const secondary = asString(raw.secondary, siteConfig.colors.secondary);
  const accent = asString(raw.accent, siteConfig.colors.accent);
  const background = asString(raw.background, siteConfig.colors.background);
  const foreground = asString(raw.foreground, siteConfig.colors.foreground);
  const muted = asString(raw.muted, siteConfig.colors.muted);
  const mutedForeground = asString(raw.mutedForeground, siteConfig.colors.mutedForeground);
  const border = asString(raw.border, siteConfig.colors.border);

  // fonts
  const fontSans = asString(raw.fontSans, siteConfig.fonts.sans);
  const fontDisplay = asString(raw.fontDisplay, siteConfig.fonts.display);

  // homepage (textes)
  const heroTitle = asString(raw.heroTitle, "");
  const heroHighlight = asString(raw.heroHighlight, "");
  const heroSubtitle = asString(raw.heroSubtitle, "");

  // homepage (toggles)
  const showCategories = asBool(raw.showCategories === "on" || raw.showCategories === "true", true);
  const showLatestGuides = asBool(raw.showLatestGuides === "on" || raw.showLatestGuides === "true", true);
  const showTopBrands = asBool(raw.showTopBrands === "on" || raw.showTopBrands === "true", true);
  const robotsIndex = raw.robotsIndex === "on" || raw.robotsIndex === "true";
  const robotsFollow = raw.robotsFollow === "on" || raw.robotsFollow === "true";
  const robotsNoarchive = raw.robotsNoarchive === "on" || raw.robotsNoarchive === "true";
  // JSONB (CTA / tiles / top brands)
  const heroCtas = asJson(raw.heroCtas);
  const categoryTiles = asJson(raw.categoryTiles);
  const topBrands = asJson(raw.topBrands);

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

      categoryTiles: categoryTiles ?? undefined,
      topBrands: topBrands ?? undefined,

      // ✅ important pour ton NOT NULL
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

      categoryTiles: categoryTiles ?? undefined,
      topBrands: topBrands ?? undefined,

      // ✅ important
      updatedAt: new Date(),
    },
  });

  // invalider pages qui dépendent du design
  revalidatePath("/");
  revalidatePath("/admin/design");
}
