// src/app/actions/adsense.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { AdPlacementType } from "@prisma/client";

const PLACEMENTS = ["pageTop", "pageInline", "pageSidebar", "pageBottom"] as const;

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

function placementValue(formData: FormData, key: string, field: string) {
  return normalizeString(formData.get(`${key}_${field}`));
}

function placementBool(formData: FormData, key: string, field: string) {
  return formData.get(`${key}_${field}`) === "on";
}

function placementType(formData: FormData, key: string): AdPlacementType {
  const raw = placementValue(formData, key, "type");

  if (raw === "AFFILIATE_BANNER") return "AFFILIATE_BANNER";
  if (raw === "CUSTOM_HTML") return "CUSTOM_HTML";

  return "ADSENSE";
}

export async function saveAdvertisingSettings(formData: FormData) {
  const siteIdRaw = formData.get("siteId");
  const siteId = typeof siteIdRaw === "string" ? siteIdRaw.trim() : "";

  if (!siteId) {
    throw new Error("Site introuvable.");
  }

  const enabled = formData.get("enabled") === "on";
  const adsenseClient = normalizeString(formData.get("adsenseClient"));

  if (!isValidAdsenseClient(adsenseClient)) {
    throw new Error("Le client Adsense est invalide. Format attendu : ca-pub-xxxxxxxxxxxxxxxx");
  }

  await prisma.adSettings.upsert({
    where: { siteId },
    update: {
      enabled,
      adsenseClient,
    },
    create: {
      siteId,
      enabled,
      adsenseClient,
    },
  });

  for (const key of PLACEMENTS) {
    const type = placementType(formData, key);
    const placementEnabled = placementBool(formData, key, "enabled");

    const adsenseSlot = placementValue(formData, key, "adsenseSlot");

    const bannerImageUrl = placementValue(formData, key, "bannerImageUrl");
    const bannerAlt = placementValue(formData, key, "bannerAlt");
    const bannerLinkUrl = placementValue(formData, key, "bannerLinkUrl");
    const bannerTitle = placementValue(formData, key, "bannerTitle");

    const customHtml = placementValue(formData, key, "customHtml");

    const openInNewTab = placementBool(formData, key, "openInNewTab");
    const nofollow = placementBool(formData, key, "nofollow");
    const sponsored = placementBool(formData, key, "sponsored");

    if (type === "ADSENSE" && !isValidSlot(adsenseSlot)) {
      throw new Error(`Le slot Adsense de l’emplacement ${key} est invalide.`);
    }

    await prisma.adPlacement.upsert({
      where: {
        siteId_key: {
          siteId,
          key,
        },
      },
      update: {
        enabled: placementEnabled,
        type,
        adsenseSlot,
        bannerImageUrl,
        bannerAlt,
        bannerLinkUrl,
        bannerTitle,
        customHtml,
        openInNewTab,
        nofollow,
        sponsored,
      },
      create: {
        siteId,
        key,
        enabled: placementEnabled,
        type,
        adsenseSlot,
        bannerImageUrl,
        bannerAlt,
        bannerLinkUrl,
        bannerTitle,
        customHtml,
        openInNewTab,
        nofollow,
        sponsored,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/pages");
  revalidatePath("/admin/monetization/adsense");
}

// Alias temporaire pour ne pas casser l’import existant
export const saveAdsenseSettings = saveAdvertisingSettings;