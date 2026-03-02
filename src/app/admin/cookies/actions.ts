// src/app/admin/cookies/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { CookiePurpose } from "@prisma/client";

function toNullableString(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function toRequiredString(v: FormDataEntryValue | null, field: string): string {
  const s = String(v ?? "").trim();
  if (!s) throw new Error(`${field} requis`);
  return s;
}

function toNullableInt(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
}

function toPurpose(v: FormDataEntryValue | null): CookiePurpose {
  const raw = String(v ?? "ESSENTIAL").trim();
  const allowed: CookiePurpose[] = ["ESSENTIAL", "ANALYTICS", "ADS", "PERSONALIZATION"];
  return (allowed.includes(raw as CookiePurpose) ? (raw as CookiePurpose) : "ESSENTIAL");
}

export async function createCookieDef(form: FormData) {
  const siteId = toNullableString(form.get("siteId"));
  const key = toRequiredString(form.get("key"), "key");
  const name = toRequiredString(form.get("name"), "name");
  const provider = toNullableString(form.get("provider"));
  const purpose = toPurpose(form.get("purpose"));
  const description = toNullableString(form.get("description"));
  const durationDays = toNullableInt(form.get("durationDays"));
  const mandatory = String(form.get("mandatory") ?? "") === "1";

  await prisma.cookieDefinition.create({
    data: {
      siteId,
      key,
      name,
      provider,
      purpose,
      description,
      durationDays,
      mandatory,
    },
  });

  revalidatePath("/admin/cookies");
}

export async function updateCookieDef(id: number, form: FormData) {
  const siteId = toNullableString(form.get("siteId"));
  const key = toRequiredString(form.get("key"), "key");
  const name = toRequiredString(form.get("name"), "name");
  const provider = toNullableString(form.get("provider"));
  const purpose = toPurpose(form.get("purpose"));
  const description = toNullableString(form.get("description"));
  const durationDays = toNullableInt(form.get("durationDays"));
  const mandatory = String(form.get("mandatory") ?? "") === "1";

  await prisma.cookieDefinition.update({
    where: { id },
    data: {
      siteId,
      key,
      name,
      provider,
      purpose,
      description,
      durationDays,
      mandatory,
    },
  });

  revalidatePath("/admin/cookies");
}

export async function deleteCookieDef(id: number) {
  await prisma.cookieDefinition.delete({ where: { id } });
  revalidatePath("/admin/cookies");
}