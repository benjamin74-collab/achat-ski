// src/app/actions/tests.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ModerationStatus } from "@prisma/client";
import { sanitizeHtml } from "@/lib/sanitize";

async function revalidateTestContexts(testId: number) {
  const test = await prisma.editorialTest.findUnique({
    where: { id: testId },
    select: {
      product: { select: { slug: true } },
    },
  });

  revalidatePath("/admin/tests");

  const slug = test?.product?.slug;
  if (slug) {
    revalidatePath(`/p/${slug}`);
  }
}

export async function approveTest(id: number) {
  await prisma.editorialTest.update({
    where: { id },
    data: { status: "APPROVED" satisfies ModerationStatus },
  });
  await revalidateTestContexts(id);
}

export async function rejectTest(id: number) {
  await prisma.editorialTest.update({
    where: { id },
    data: { status: "REJECTED" satisfies ModerationStatus },
  });
  await revalidateTestContexts(id);
}

export async function deleteTest(id: number) {
  const test = await prisma.editorialTest.delete({
    where: { id },
    select: {
      product: { select: { slug: true } },
    },
  });

  revalidatePath("/admin/tests");

  const slug = test.product?.slug;
  if (slug) {
    revalidatePath(`/p/${slug}`);
  }
}

type RatingInput = {
  categoryId: number;
  score: number; // 0..10
};

// ✅ Nouveau : on passe un productId déjà résolu côté client
type CreateTestInput = {
  productId: number;
  title: string;
  excerpt?: string;
  content?: string; // HTML WYSIWYG
  score?: number | null;
  sourceName: string;
  sourceUrl: string;
  status?: keyof typeof ModerationStatus;

  // Bannière
  bannerUrl?: string | null;
  bannerAssetId?: number | null;

  // Notes par catégorie
  ratings?: RatingInput[];
};

export async function createTest(input: CreateTestInput) {
  if (!input.productId || !Number.isFinite(input.productId)) {
    throw new Error("Produit invalide : aucun produit sélectionné.");
  }

  // On vérifie que le produit existe bien et on récupère son slug pour revalidation
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, slug: true },
  });

  if (!product) {
    throw new Error("Produit introuvable.");
  }

  const status: ModerationStatus = (input.status ?? "PENDING") as ModerationStatus;
  const bannerId =
    typeof input.bannerAssetId === "number" && Number.isFinite(input.bannerAssetId)
      ? input.bannerAssetId
      : null;

  const ratings = input.ratings ?? [];

  const created = await prisma.editorialTest.create({
    data: {
      productId: product.id,
      title: input.title,
      excerpt: input.excerpt ?? "",
      content: input.content ? sanitizeHtml(input.content) : null,
      score: typeof input.score === "number" ? input.score : null,
      sourceName: input.sourceName,
      sourceUrl: input.sourceUrl,
      status,
      bannerUrl: input.bannerUrl ?? null,
      ...(bannerId ? { bannerId } : {}),

      // Notes par catégorie (0..10)
      ...(ratings.length > 0
        ? {
            ratings: {
              create: ratings.map((r) => ({
                score: Math.max(0, Math.min(10, r.score)),
                category: { connect: { id: r.categoryId } },
              })),
            },
          }
        : {}),
    },
  });

  // Revalidation contextuelle (admin + fiche produit)
  await revalidateTestContexts(created.id);
}
