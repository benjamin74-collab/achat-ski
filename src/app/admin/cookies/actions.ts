// src/app/admin/cookies/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCookieDef(form: FormData) {
  const siteId = (form.get("siteId") as string) || null;
  const key = String(form.get("key") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const provider = (form.get("provider") as string) || null;
  const purpose = String(form.get("purpose") ?? "ESSENTIAL");
  const description = (form.get("description") as string) || null;
  const durationDaysRaw = form.get("durationDays") as string;
  const durationDays = durationDaysRaw ? Number(durationDaysRaw) : null;
  const mandatory = String(form.get("mandatory") ?? "") === "1";

  if (!key || !name) throw new Error("key et name requis.");

  await prisma.cookieDefinition.create({
    data: {
      siteId,
      key,
      name,
      provider,
      purpose: purpose as any,
      description,
      durationDays: Number.isFinite(durationDays as number) ? (durationDays as number) : null,
      mandatory,
    },
  });

  revalidatePath("/admin/cookies");
}

export async function updateCookieDef(id: number, form: FormData) {
  const siteId = (form.get("siteId") as string) || null;
  const key = String(form.get("key") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const provider = (form.get("provider") as string) || null;
  const purpose = String(form.get("purpose") ?? "ESSENTIAL");
  const description = (form.get("description") as string) || null;
  const durationDaysRaw = form.get("durationDays") as string;
  const durationDays = durationDaysRaw ? Number(durationDaysRaw) : null;
  const mandatory = String(form.get("mandatory") ?? "") === "1";

  if (!key || !name) throw new Error("key et name requis.");

  await prisma.cookieDefinition.update({
    where: { id },
    data: {
      siteId,
      key,
      name,
      provider,
      purpose: purpose as any,
      description,
      durationDays: Number.isFinite(durationDays as number) ? (durationDays as number) : null,
      mandatory,
    },
  });

  revalidatePath("/admin/cookies");
}

export async function deleteCookieDef(id: number) {
  await prisma.cookieDefinition.delete({ where: { id } });
  revalidatePath("/admin/cookies");
}