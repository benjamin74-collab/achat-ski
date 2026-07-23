"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type FeedImportActionResult = {
  success: boolean;
  message: string;
};

export async function runFeedImportAction(
  feedId: number
): Promise<FeedImportActionResult> {
  if (!Number.isInteger(feedId) || feedId <= 0) {
    return {
      success: false,
      message: "Identifiant de flux invalide.",
    };
  }

  const feed = await prisma.feedSource.findUnique({
    where: {
      id: feedId,
    },
    select: {
      id: true,
      name: true,
      active: true,
    },
  });

  if (!feed) {
    return {
      success: false,
      message: "Le flux demandé n’existe pas.",
    };
  }

  if (!feed.active) {
    return {
      success: false,
      message: "Le flux est inactif. Active-le avant de lancer un import.",
    };
  }

  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return {
      success: false,
      message: "La variable CRON_SECRET n’est pas configurée.",
    };
  }

  try {
    const requestHeaders = await headers();

    const forwardedHost = requestHeaders.get("x-forwarded-host");
    const host = forwardedHost || requestHeaders.get("host");

    const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
    const protocol =
      forwardedProtocol ||
      (host?.includes("localhost") ? "http" : "https");

    const configuredBaseUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
      process.env.SITE_URL?.replace(/\/+$/, "");

    const baseUrl =
      configuredBaseUrl ||
      (host ? `${protocol}://${host}` : null);

    if (!baseUrl) {
      return {
        success: false,
        message:
          "Impossible de déterminer l’adresse du site pour appeler le cron.",
      };
    }

    const url = new URL(
      "/api/cron/catalog-sync",
      baseUrl
    );

    url.searchParams.set(
      "feedSourceId",
      String(feedId)
    );

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const rawBody = await response.text();

    let responseBody: unknown = null;

    try {
      responseBody = rawBody
        ? JSON.parse(rawBody)
        : null;
    } catch {
      responseBody = rawBody;
    }

    if (!response.ok) {
      return {
        success: false,
        message: extractErrorMessage(
          responseBody,
          `Le cron a répondu avec le statut HTTP ${response.status}.`
        ),
      };
    }

    const successful =
      isSuccessfulResponse(responseBody);

    revalidatePath("/admin/feeds");
    revalidatePath(`/admin/feeds/${feedId}`);
    revalidatePath(
      `/admin/feeds/${feedId}/history`
    );

    if (!successful) {
      return {
        success: false,
        message: extractErrorMessage(
          responseBody,
          "L’import s’est terminé avec une erreur."
        ),
      };
    }

    return {
      success: true,
      message: `L’import du flux « ${feed.name} » est terminé.`,
    };
  } catch (error) {
    console.error(
      `[admin feeds] Import manuel du flux ${feedId} impossible`,
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue.",
    };
  }
}

function isSuccessfulResponse(
  value: unknown
): boolean {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return true;
  }

  if (
    "ok" in value &&
    typeof value.ok === "boolean"
  ) {
    return value.ok;
  }

  if (
    "success" in value &&
    typeof value.success === "boolean"
  ) {
    return value.success;
  }

  return true;
}

function extractErrorMessage(
  value: unknown,
  fallback: string
): string {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (
    typeof value !== "object" ||
    value === null
  ) {
    return fallback;
  }

  const record = value as Record<string, unknown>;

  const candidateKeys = [
    "message",
    "error",
    "errorMessage",
  ];

  for (const key of candidateKeys) {
    const candidate = record[key];

    if (
      typeof candidate === "string" &&
      candidate.trim().length > 0
    ) {
      return candidate;
    }
  }

  return fallback;
}