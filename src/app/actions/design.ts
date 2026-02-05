// src/app/actions/design.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/config/site";
import { z } from "zod";

const SiteIdSchema = z.string().min(1);

const BoolSchema = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === "boolean" ? v : v === "on" || v === "true"));

function jsonField(schema: z.ZodTypeAny) {
  return z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim())
    .transform((v) => {
      if (!v) return null;
      try {
        return JSON.parse(v);
      } catch {
        return "__INVALID_JSON__";
      }
    })
    .refine((v) => v !== "__INVALID_JSON__", "JSON invalide");
}

const HeroCtaSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  variant: z.enum(["primary", "outline"]).optional(),
});

const CategoryTileSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  desc: z.string().min(1),
  cta: z.string().min(1),
  img: z.string().min(1),
});

const TopBrandSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  logo: z.string().min(1),
});

const DesignFormSchema = z.object({
  siteId: SiteIdSchema,

  // branding
  name: z.string().optional(),
  tagline: z.string().optional(),
  logoSrc: z.string().optional(),
  logoAlt: z.string().optional(),
  faviconSrc: z.string().optional(),

  // colors
  primary: z.string().min(1),
  secondary: z.string().min(1),
  accent: z.string().min(1),
  background: z.string().min(1),
  foreground: z.string().min(1),
  muted: z.string().min(1),
  mutedForeground: z.string().min(1),
  border: z.string().min(1),

  // fonts
  fontSans: z.string().min(1),
  fontDisplay: z.string().min(1),

  // home hero
  heroTitle: z.string().optional(),
  heroHighlight: z.string().optional(),
  heroSubtitle: z.string().optional(),

  heroCtas: jsonField(z.array(HeroCtaSchema).nullable()),

  // toggles home
  showCategories: BoolSchema,
  showLatestGuides: BoolSchema,
  showTopBrands: BoolSchema,

  categoryTiles: jsonField(z.array(CategoryTileSchema).nullable()),
  topBrands: jsonField(z.array(TopBrandSchema).nullable()),
});

function fdGet(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v : undefined;
}

export async function saveDesign(formData: FormData) {
  const raw = {
    siteId: fdGet(formData, "siteId"),

    name: fdGet(formData, "name"),
    tagline: fdGet(formData, "tagline"),
    logoSrc: fdGet(formData, "logoSrc"),
    logoAlt: fdGet(formData, "logoAlt"),
    faviconSrc: fdGet(formData, "faviconSrc"),

    primary: fdGet(formData, "primary"),
    secondary: fdGet(formData, "secondary"),
    accent: fdGet(formData, "accent"),
    background: fdGet(formData, "background"),
    foreground: fdGet(formData, "foreground"),
    muted: fdGet(formData, "muted"),
    mutedForeground: fdGet(formData, "mutedForeground"),
    border: fdGet(formData, "border"),

    fontSans: fdGet(formData, "fontSans"),
    fontDisplay: fdGet(formData, "fontDisplay"),

    heroTitle: fdGet(formData, "heroTitle"),
    heroHighlight: fdGet(formData, "heroHighlight"),
    heroSubtitle: fdGet(formData, "heroSubtitle"),

    heroCtas: fdGet(formData, "heroCtas"),

    showCategories: formData.get("showCategories"),
    showLatestGuides: formData.get("showLatestGuides"),
    showTopBrands: formData.get("showTopBrands"),

    categoryTiles: fdGet(formData, "categoryTiles"),
    topBrands: fdGet(formData, "topBrands"),
  };

  const parsed = DesignFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  // si JSON null => on stocke null
  // Prisma JSON: on peut passer `data.heroCtas ?? undefined` selon ta contrainte.
  const now = new Date();

  await prisma.siteSettings.upsert({
    where: { siteId: data.siteId },
    update: {
      name: data.name,
      tagline: data.tagline,
      logoSrc: data.logoSrc,
      logoAlt: data.logoAlt,
      faviconSrc: data.faviconSrc,

      primary: data.primary,
      secondary: data.secondary,
      accent: data.accent,
      background: data.background,
      foreground: data.foreground,
      muted: data.muted,
      mutedForeground: data.mutedForeground,
      border: data.border,

      fontSans: data.fontSans,
      fontDisplay: data.fontDisplay,

      heroTitle: data.heroTitle,
      heroHighlight: data.heroHighlight,
      heroSubtitle: data.heroSubtitle,

      heroCtas: data.heroCtas as any,

      showCategories: data.showCategories,
      showLatestGuides: data.showLatestGuides,
      showTopBrands: data.showTopBrands,

      categoryTiles: data.categoryTiles as any,
      topBrands: data.topBrands as any,

      // ✅ si ta table SQL a une contrainte NOT NULL sans default/@updatedAt fiable
      updatedAt: now as any,
    },
    create: {
      siteId: data.siteId,

      name: data.name,
      tagline: data.tagline,
      logoSrc: data.logoSrc,
      logoAlt: data.logoAlt,
      faviconSrc: data.faviconSrc,

      primary: data.primary,
      secondary: data.secondary,
      accent: data.accent,
      background: data.background,
      foreground: data.foreground,
      muted: data.muted,
      mutedForeground: data.mutedForeground,
      border: data.border,

      fontSans: data.fontSans,
      fontDisplay: data.fontDisplay,

      heroTitle: data.heroTitle,
      heroHighlight: data.heroHighlight,
      heroSubtitle: data.heroSubtitle,

      heroCtas: data.heroCtas as any,

      showCategories: data.showCategories,
      showLatestGuides: data.showLatestGuides,
      showTopBrands: data.showTopBrands,

      categoryTiles: data.categoryTiles as any,
      topBrands: data.topBrands as any,

      createdAt: now as any,
      updatedAt: now as any,
    },
  });

  return { ok: true };
}

export async function resetDesign(siteId: string) {
  const id = SiteIdSchema.parse(siteId);
  const cfg = getSiteConfig(id);

  const now = new Date();

  await prisma.siteSettings.upsert({
    where: { siteId: id },
    update: {
      name: cfg.name,
      tagline: (cfg as any).tagline ?? null,
      logoSrc: cfg.brand.logoSrc,
      logoAlt: cfg.brand.logoAlt,
      faviconSrc: cfg.brand.faviconSrc ?? null,

      primary: cfg.colors.primary,
      secondary: cfg.colors.secondary,
      accent: cfg.colors.accent,
      background: cfg.colors.background,
      foreground: cfg.colors.foreground,
      muted: cfg.colors.muted,
      mutedForeground: cfg.colors.mutedForeground,
      border: cfg.colors.border,

      fontSans: cfg.fonts.sans,
      fontDisplay: cfg.fonts.display,

      updatedAt: now as any,
    },
    create: {
      siteId: id,
      name: cfg.name,
      tagline: (cfg as any).tagline ?? null,
      logoSrc: cfg.brand.logoSrc,
      logoAlt: cfg.brand.logoAlt,
      faviconSrc: cfg.brand.faviconSrc ?? null,

      primary: cfg.colors.primary,
      secondary: cfg.colors.secondary,
      accent: cfg.colors.accent,
      background: cfg.colors.background,
      foreground: cfg.colors.foreground,
      muted: cfg.colors.muted,
      mutedForeground: cfg.colors.mutedForeground,
      border: cfg.colors.border,

      fontSans: cfg.fonts.sans,
      fontDisplay: cfg.fonts.display,

      showCategories: true,
      showLatestGuides: true,
      showTopBrands: true,

      createdAt: now as any,
      updatedAt: now as any,
    },
  });

  return { ok: true };
}
