// src/app/actions/tests.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ModerationStatus } from "@prisma/client";

export async function approveTest(id: number) {
  await prisma.editorialTest.update({
    where: { id },
    data: { status: "APPROVED" satisfies ModerationStatus },
  });
  revalidatePath("/admin/tests");
}

export async function rejectTest(id: number) {
  await prisma.editorialTest.update({
    where: { id },
    data: { status: "REJECTED" satisfies ModerationStatus },
  });
  revalidatePath("/admin/tests");
}

export async function deleteTest(id: number) {
  await prisma.editorialTest.delete({ where: { id } });
  revalidatePath("/admin/tests");
}

type CreateTestInput = {
  productSlugOrId: string;
  title: string;
  excerpt?: string;
  score?: number | null;
  sourceName: string;
  sourceUrl: string;
  status?: keyof typeof ModerationStatus;
};

export async function createTest(input: CreateTestInput) {
  // Résoudre productId à partir d’un slug ou id
  let productId: number | null = null;

  if (/^\d+$/.test(input.productSlugOrId)) {
    productId = Number(input.productSlugOrId);
  } else {
    const p = await prisma.product.findUnique({
      where: { slug: input.productSlugOrId },
      select: { id: true },
    });
    productId = p?.id ?? null;
  }

  if (!productId) {
    throw new Error("Produit introuvable (slug ou id incorrect).");
  }

  const status: ModerationStatus = (input.status ?? "PENDING") as ModerationStatus;

  await prisma.editorialTest.create({
    data: {
      productId,
      title: input.title,
      excerpt: input.excerpt ?? "",
      score: typeof input.score === "number" ? input.score : null,
      sourceName: input.sourceName,
      sourceUrl: input.sourceUrl,
      status,
      // publishedAt par défaut via schema (now)
    },
  });

  revalidatePath("/admin/tests");
}
