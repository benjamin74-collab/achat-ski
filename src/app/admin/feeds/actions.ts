"use server";

import {
  FeedFormat,
  FeedFrequency,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export type FeedSourceFormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
};

export const INITIAL_FEED_SOURCE_FORM_STATE: FeedSourceFormState = {
  success: false,
  message: "",
  errors: {},
};

type ParsedFeedSourceForm = {
  affiliateProgramId: number;
  siteId: string;

  name: string;
  slug: string;
  sourceUrl: string;

  format: FeedFormat;
  delimiter: string;
  encoding: string;

  active: boolean;
  autoImport: boolean;

  frequency: FeedFrequency;
  timezone: string;

  nextRunAt: Date | null;
};

export async function createFeedSourceAction(
  _previousState: FeedSourceFormState,
  formData: FormData
): Promise<FeedSourceFormState> {
  const parsed = await parseFeedSourceForm(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const values = parsed.values;

  try {
    const existingFeed = await prisma.feedSource.findUnique({
      where: {
        siteId_slug: {
          siteId: values.siteId,
          slug: values.slug,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingFeed) {
      return {
        success: false,
        message: "Un flux utilise déjà ce slug pour ce site.",
        errors: {
          slug: "Ce slug est déjà utilisé.",
        },
      };
    }

    const feed = await prisma.feedSource.create({
      data: values,
      select: {
        id: true,
      },
    });

    revalidatePath("/admin/feeds");

    redirect(`/admin/feeds/${feed.id}`);
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("[admin feeds] Création impossible", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant la création du flux.",
    };
  }
}

export async function updateFeedSourceAction(
  feedId: number,
  _previousState: FeedSourceFormState,
  formData: FormData
): Promise<FeedSourceFormState> {
  if (!Number.isInteger(feedId) || feedId <= 0) {
    return {
      success: false,
      message: "Identifiant de flux invalide.",
    };
  }

  const parsed = await parseFeedSourceForm(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const values = parsed.values;

  try {
    const existingFeed = await prisma.feedSource.findFirst({
      where: {
        siteId: values.siteId,
        slug: values.slug,
        id: {
          not: feedId,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingFeed) {
      return {
        success: false,
        message: "Un autre flux utilise déjà ce slug pour ce site.",
        errors: {
          slug: "Ce slug est déjà utilisé.",
        },
      };
    }

    await prisma.feedSource.update({
      where: {
        id: feedId,
      },
      data: values,
    });

    revalidatePath("/admin/feeds");
    revalidatePath(`/admin/feeds/${feedId}`);
    revalidatePath(`/admin/feeds/${feedId}/edit`);

    redirect(`/admin/feeds/${feedId}`);
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error(
      `[admin feeds] Modification du flux ${feedId} impossible`,
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant la modification du flux.",
    };
  }
}

export async function deleteFeedSourceAction(
  feedId: number
): Promise<FeedSourceFormState> {
  if (!Number.isInteger(feedId) || feedId <= 0) {
    return {
      success: false,
      message: "Identifiant de flux invalide.",
    };
  }

  try {
    const feed = await prisma.feedSource.findUnique({
      where: {
        id: feedId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!feed) {
      return {
        success: false,
        message: "Ce flux n’existe plus.",
      };
    }

    await prisma.feedSource.delete({
      where: {
        id: feedId,
      },
    });

    revalidatePath("/admin/feeds");

    return {
      success: true,
      message: `Le flux « ${feed.name} » a été supprimé.`,
    };
  } catch (error) {
    console.error(
      `[admin feeds] Suppression du flux ${feedId} impossible`,
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant la suppression du flux.",
    };
  }
}

async function parseFeedSourceForm(
  formData: FormData
): Promise<
  | {
      success: true;
      values: ParsedFeedSourceForm;
    }
  | {
      success: false;
      state: FeedSourceFormState;
    }
> {
  const affiliateProgramId = parsePositiveInteger(
    formData.get("affiliateProgramId")
  );

  const name = getString(formData, "name");
  const providedSlug = getString(formData, "slug");
  const sourceUrl = getString(formData, "sourceUrl");

  const formatValue = getString(formData, "format");
  const delimiterValue = getString(formData, "delimiter");
  const encoding = getString(formData, "encoding") || "utf-8";

  const active = formData.get("active") === "on";
  const requestedAutoImport =
    formData.get("autoImport") === "on";

  const frequencyValue = getString(formData, "frequency");
  const timezone =
    getString(formData, "timezone") || "Europe/Paris";

  const errors: Record<string, string> = {};

  if (!affiliateProgramId) {
    errors.affiliateProgramId =
      "Sélectionnez un programme d’affiliation.";
  }

  if (!name) {
    errors.name = "Le nom du flux est obligatoire.";
  }

  if (!sourceUrl) {
    errors.sourceUrl = "L’URL du flux est obligatoire.";
  } else if (!isValidHttpUrl(sourceUrl)) {
    errors.sourceUrl =
      "L’adresse doit être une URL HTTP ou HTTPS valide.";
  }

  const format = parseFeedFormat(formatValue);

  if (!format) {
    errors.format = "Le format sélectionné est invalide.";
  }

  const frequency = parseFeedFrequency(frequencyValue);

  if (!frequency) {
    errors.frequency =
      "La fréquence sélectionnée est invalide.";
  }

  if (!timezone) {
    errors.timezone = "Le fuseau horaire est obligatoire.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      state: {
        success: false,
        message: "Certains champs doivent être corrigés.",
        errors,
      },
    };
  }

  const affiliateProgram =
    await prisma.affiliateProgram.findUnique({
      where: {
        id: affiliateProgramId!,
      },
      select: {
        id: true,
        siteId: true,
        active: true,

        merchant: {
          select: {
            active: true,
          },
        },

        network: {
          select: {
            active: true,
          },
        },
      },
    });

  if (!affiliateProgram) {
    return {
      success: false,
      state: {
        success: false,
        message:
          "Le programme d’affiliation sélectionné n’existe pas.",
        errors: {
          affiliateProgramId:
            "Programme d’affiliation introuvable.",
        },
      },
    };
  }

  const slug =
    normalizeSlug(providedSlug) || normalizeSlug(name);

  if (!slug) {
    return {
      success: false,
      state: {
        success: false,
        message: "Le slug du flux est invalide.",
        errors: {
          slug: "Saisissez un slug valide.",
        },
      },
    };
  }

  const finalFrequency = frequency!;
  const autoImport =
    requestedAutoImport &&
    finalFrequency !== FeedFrequency.MANUAL_ONLY;

  const delimiter = getDefaultDelimiter(
    format!,
    delimiterValue
  );

  return {
    success: true,
    values: {
      affiliateProgramId: affiliateProgram.id,
      siteId: affiliateProgram.siteId,

      name,
      slug,
      sourceUrl,

      format: format!,
      delimiter,
      encoding,

      active,
      autoImport,

      frequency: finalFrequency,
      timezone,

      nextRunAt:
        active && autoImport
          ? computeNextRunAt(finalFrequency)
          : null,
    },
  };
}

function computeNextRunAt(
  frequency: FeedFrequency
): Date | null {
  const nextRunAt = new Date();

  switch (frequency) {
    case FeedFrequency.EVERY_6_HOURS:
      nextRunAt.setHours(nextRunAt.getHours() + 6);
      return nextRunAt;

    case FeedFrequency.EVERY_12_HOURS:
      nextRunAt.setHours(nextRunAt.getHours() + 12);
      return nextRunAt;

    case FeedFrequency.DAILY:
      nextRunAt.setDate(nextRunAt.getDate() + 1);
      return nextRunAt;

    case FeedFrequency.WEEKLY:
      nextRunAt.setDate(nextRunAt.getDate() + 7);
      return nextRunAt;

    case FeedFrequency.MANUAL_ONLY:
    default:
      return null;
  }
}

function getDefaultDelimiter(
  format: FeedFormat,
  providedDelimiter: string
): string {
  if (format === FeedFormat.TSV) {
    return "\t";
  }

  if (format !== FeedFormat.CSV) {
    return providedDelimiter || ";";
  }

  return providedDelimiter || ";";
}

function parseFeedFormat(
  value: string
): FeedFormat | null {
  return Object.values(FeedFormat).includes(
    value as FeedFormat
  )
    ? (value as FeedFormat)
    : null;
}

function parseFeedFrequency(
  value: string
): FeedFrequency | null {
  return Object.values(FeedFrequency).includes(
    value as FeedFrequency
  )
    ? (value as FeedFrequency)
    : null;
}

function parsePositiveInteger(
  value: FormDataEntryValue | null
): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : null;
}

function getString(
  formData: FormData,
  key: string
): string {
  const value = formData.get(key);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function isNextRedirectError(error: unknown): boolean {
  if (
    typeof error !== "object" ||
    error === null ||
    !("digest" in error)
  ) {
    return false;
  }

  return String(error.digest).startsWith("NEXT_REDIRECT");
}