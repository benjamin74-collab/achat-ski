"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ModerationStatus } from "@prisma/client";

/** Actions modération */
export async function approveReview(id: number) {
  await prisma.review.update({
    where: { id },
    data: { status: "APPROVED" satisfies ModerationStatus },
  });
  revalidatePath("/admin/reviews");
}

export async function rejectReview(id: number) {
  await prisma.review.update({
    where: { id },
    data: { status: "REJECTED" satisfies ModerationStatus },
  });
  revalidatePath("/admin/reviews");
}

export async function deleteReview(id: number) {
  await prisma.review.delete({ where: { id } });
  revalidatePath("/admin/reviews");
}

/** Création */
type CreateReviewInput = {
  /** slug produit (prioritaire) ou id numérique */
  productSlugOrId: string;
  rating: number;
  title: string;
  body?: string;
  authorName?: string;
  sourceName?: string;
  sourceUrl?: string;
  /** chaîne "PENDING" | "APPROVED" | "REJECTED" */
  status?: keyof typeof ModerationStatus;
};

export async function createReview(input: CreateReviewInput) {
  // Résolution produit : slug (par défaut) sinon id num
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

  // Clamp rating 1..5
  const rating = Math.max(1, Math.min(5, Number(input.rating) || 0));

  // Mapper la chaîne vers le type ModerationStatus (par défaut PENDING)
  const statusStr = (input.status ?? "PENDING") as keyof typeof ModerationStatus;
  const status: ModerationStatus = statusStr;

  await prisma.review.create({
    data: {
      productId,
      rating,
      title: input.title,
      body: input.body ?? "",
      authorName: input.authorName || undefined,
      sourceName: input.sourceName || undefined,
      sourceUrl: input.sourceUrl || undefined,
      status,
    },
  });

  revalidatePath("/admin/reviews");
}
