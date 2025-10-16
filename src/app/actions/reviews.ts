"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ModerationStatus } from "@prisma/client";

export async function approveReview(id: number) {
  await prisma.review.update({
    where: { id },
    data: { status: ModerationStatus.APPROVED },
  });
  revalidatePath("/admin/reviews");
}

export async function rejectReview(id: number) {
  await prisma.review.update({
    where: { id },
    data: { status: ModerationStatus.REJECTED },
  });
  revalidatePath("/admin/reviews");
}

export async function deleteReview(id: number) {
  await prisma.review.delete({ where: { id } });
  revalidatePath("/admin/reviews");
}

type CreateReviewInput = {
  productSlugOrId: string;
  rating: number;
  title: string;
  body?: string;
  authorName?: string;
  sourceName?: string;
  sourceUrl?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
};

export async function createReview(input: CreateReviewInput) {
  // Trouve le produit par slug (prioritaire) ou par id numeric
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

  await prisma.review.create({
    data: {
      productId,
      rating: Math.max(1, Math.min(5, input.rating)),
      title: input.title,
      body: input.body ?? "",
      authorName: input.authorName,
      sourceName: input.sourceName,
      sourceUrl: input.sourceUrl,
      status: (input.status as any) ?? "PENDING",
    },
  });

  revalidatePath("/admin/reviews");
}
