"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function normalizeString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v.length ? v : null;
}

function isValidGa4Id(value: string | null): boolean {
  if (!value) return true;
  return /^G-[A-Z0-9]+$/i.test(value);
}

function isValidGoogleAdsId(value: string | null): boolean {
  if (!value) return true;
  return /^AW-\d+$/i.test(value);
}

function isValidGtmId(value: string | null): boolean {
  if (!value) return true;
  return /^GTM-[A-Z0-9]+$/i.test(value);
}

export async function saveTrackingSettings(formData: FormData) {
  const siteIdRaw = formData.get("siteId");
  const siteId = typeof siteIdRaw === "string" ? siteIdRaw.trim() : "";

  if (!siteId) {
    throw new Error("Site introuvable.");
  }

  const enabledAnalytics = formData.get("enabledAnalytics") === "on";
  const enabledAds = formData.get("enabledAds") === "on";
  const enabledGtm = formData.get("enabledGtm") === "on";

  const ga4MeasurementId = normalizeString(formData.get("ga4MeasurementId"));
  const googleAdsId = normalizeString(formData.get("googleAdsId"));
  const googleAdsConversionLabel = normalizeString(formData.get("googleAdsConversionLabel"));
  const gtmContainerId = normalizeString(formData.get("gtmContainerId"));

  if (!isValidGa4Id(ga4MeasurementId)) {
    throw new Error("ID GA4 invalide. Format attendu : G-XXXXXXXXXX");
  }

  if (!isValidGoogleAdsId(googleAdsId)) {
    throw new Error("ID Google Ads invalide. Format attendu : AW-123456789");
  }

  if (!isValidGtmId(gtmContainerId)) {
    throw new Error("ID GTM invalide. Format attendu : GTM-XXXXXXX");
  }

  await prisma.trackingSettings.upsert({
    where: { siteId },
    create: {
      siteId,
      enabledAnalytics,
      enabledAds,
      enabledGtm,
      ga4MeasurementId,
      googleAdsId,
      googleAdsConversionLabel,
      gtmContainerId,
    },
    update: {
      enabledAnalytics,
      enabledAds,
      enabledGtm,
      ga4MeasurementId,
      googleAdsId,
      googleAdsConversionLabel,
      gtmContainerId,
    },
  });

  revalidatePath("/admin/marketing/tracking");
  revalidatePath("/");
}