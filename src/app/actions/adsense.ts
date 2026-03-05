// src/app/actions/adsense.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function normalizeString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v.length ? v : null;
}

function isValidAdsenseClient(value: string | null): boolean {
  if (!value) return true;
  return /^ca-pub-\d{10,20}$/.test(value);
}

function isValidSlot(value: string | null): boolean {
  if (!value) return true;
  return /^\d{6,20}$/.test(value);
}

export async function saveAdsenseSettings(formData: FormData) {
  const siteIdRaw = formData.get("siteId");
  const siteId = typeof siteIdRaw === "string" ? siteIdRaw.trim() : "";

  if (!siteId) {
    throw new Error("Site introuvable.");
  }

  const enabled = formData.get("enabled") === "on";

  const adsenseClient = normalizeString(formData.get("adsenseClient"));
  const slotPageTop = normalizeString(formData.get("slotPageTop"));
  const slotPageInline = normalizeString(formData.get("slotPageInline"));
  const slotPageSidebar = normalizeString(formData.get("slotPageSidebar"));
  const slotPageBottom = normalizeString(formData.get("slotPageBottom"));

  if (!isValidAdsenseClient(adsenseClient)) {
    throw new Error("Le client Adsense est invalide. Format attendu : ca-pub-xxxxxxxxxxxxxxxx");
  }

  if (!isValidSlot(slotPageTop)) {
    throw new Error("Le slot haut de page est invalide.");
  }

  if (!isValidSlot(slotPageInline)) {
    throw new Error("Le slot dans l’article est invalide.");
  }

  if (!isValidSlot(slotPageSidebar)) {
    throw new Error("Le slot sidebar est invalide.");
  }

  if (!isValidSlot(slotPageBottom)) {
    throw new Error("Le slot bas de page est invalide.");
  }

  await prisma.adSettings.upsert({
    where: { siteId },
    update: {
      enabled,
      adsenseClient,
      slotPageTop,
      slotPageInline,
      slotPageSidebar,
      slotPageBottom,
    },
    create: {
      siteId,
      enabled,
      adsenseClient,
      slotPageTop,
      slotPageInline,
      slotPageSidebar,
      slotPageBottom,
    },
  });

  revalidatePath("/admin/monetization/adsense");
  revalidatePath("/pages");
}