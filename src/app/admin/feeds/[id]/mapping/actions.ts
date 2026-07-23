"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updateColumnMappingAction(
  formData: FormData
): Promise<void> {
  const feedId = parsePositiveInteger(
    formData.get("feedId")
  );

  const mappingId = parsePositiveInteger(
    formData.get("mappingId")
  );

  if (!feedId || !mappingId) {
    throw new Error(
      "Identifiant de mapping invalide."
    );
  }

  const existing =
    await prisma.feedColumnMapping.findFirst({
      where: {
        id: mappingId,
        feedSourceId: feedId,
      },
      select: {
        id: true,
      },
    });

  if (!existing) {
    throw new Error(
      "Le mapping demandé n’existe pas."
    );
  }

  const sourceColumn = getString(
    formData.get("sourceColumn")
  );

  const fallbackColumns = parseStringList(
    formData.get("fallbackColumns")
  );

  const defaultValue =
    getNullableString(
      formData.get("defaultValue")
    );

  const transform =
    getNullableString(
      formData.get("transform")
    );

  const required =
    formData.get("required") === "on";

  const order =
    parseInteger(formData.get("order")) ?? 0;

  if (!sourceColumn) {
    throw new Error(
      "La colonne source est obligatoire."
    );
  }

  await prisma.feedColumnMapping.update({
    where: {
      id: mappingId,
    },
    data: {
      sourceColumn,
      fallbackColumns,
      defaultValue,
      transform,
      required,
      order,
    },
  });

  revalidatePath(`/admin/feeds/${feedId}`);
  revalidatePath(
    `/admin/feeds/${feedId}/mapping`
  );
}

function parsePositiveInteger(
  value: FormDataEntryValue | null
): number | null {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return null;
  }

  return parsed;
}

function parseInteger(
  value: FormDataEntryValue | null
): number | null {
  const parsed = Number(value);

  return Number.isInteger(parsed)
    ? parsed
    : null;
}

function getString(
  value: FormDataEntryValue | null
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getNullableString(
  value: FormDataEntryValue | null
): string | null {
  const result = getString(value);
  return result || null;
}

function parseStringList(
  value: FormDataEntryValue | null
): string[] {
  return getString(value)
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter(
      (item, index, values) =>
        values.indexOf(item) === index
    );
}