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

// ✅ sourceUrl devient optionnelle
type CreateTestInput = {
  productId?: number;          // utilisé par le backoffice admin
  productSlugOrId?: string;    // compatibilité avec /me/tests/new

  title: string;
  excerpt?: string;
  content?: string; // HTML WYSIWYG
  score?: number | null;
  sourceName: string;
  sourceUrl?: string;
  status?: keyof typeof ModerationStatus;

  // Bannière
  bannerUrl?: string | null;
  bannerAssetId?: number | null;

  // Notes par catégorie
  ratings?: RatingInput[];
};

export async function createTest(input: CreateTestInput) {
  let productId: number | null = null;
  let productSlug: string | null = null;

  // 1️⃣ Cas privilégié : productId fourni (backoffice)
  if (typeof input.productId === "number" && Number.isFinite(input.productId)) {
    const p = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, slug: true },
    });
    if (!p) {
      throw new Error("Produit introuvable.");
    }
    productId = p.id;
    productSlug = p.slug;
  } else if (input.productSlugOrId && input.productSlugOrId.trim()) {
    // 2️⃣ Compat : ancien flux slug/ID
    const raw = input.productSlugOrId.trim();
    if (/^\d+$/.test(raw)) {
      const p = await prisma.product.findUnique({
        where: { id: Number(raw) },
        select: { id: true, slug: true },
      });
      productId = p?.id ?? null;
      productSlug = p?.slug ?? null;
    } else {
      const p = await prisma.product.findUnique({
        where: { slug: raw },
        select: { id: true, slug: true },
      });
      productId = p?.id ?? null;
      productSlug = p?.slug ?? null;
    }
  }

  if (!productId) {
    throw new Error("Produit introuvable (aucun produit valide fourni).");
  }

  const status: ModerationStatus = (input.status ?? "PENDING") as ModerationStatus;
  const bannerId =
    typeof input.bannerAssetId === "number" && Number.isFinite(input.bannerAssetId)
      ? input.bannerAssetId
      : null;

  const ratings = input.ratings ?? [];

  const created = await prisma.editorialTest.create({
    data: {
      productId,
      title: input.title,
      excerpt: input.excerpt ?? "",
      content: input.content ? sanitizeHtml(input.content) : null,
      score: typeof input.score === "number" ? input.score : null,
      sourceName: input.sourceName,
      sourceUrl: input.sourceUrl ?? "",
      status,
      bannerUrl: input.bannerUrl ?? null,
      ...(bannerId ? { bannerId } : {}),

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

  await revalidateTestContexts(created.id);

  if (productSlug) {
    revalidatePath(`/p/${productSlug}`);
  }
}
