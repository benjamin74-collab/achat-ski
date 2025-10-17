// src/app/me/reviews/new/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { createReview } from "@/app/actions/reviews";

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: { productId?: string; slug?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin?callbackUrl=/me/reviews/new");

  const productKey = searchParams.slug ?? searchParams.productId ?? null;
  if (!productKey) return notFound();
  const productSlugOrId = String(productKey); // ✅ forcé en string

  async function action(formData: FormData) {
    "use server";
    const rating = Number(formData.get("rating") ?? 0);
    const title = String(formData.get("title") ?? "");
    const body = String(formData.get("body") ?? "");
    await createReview({
      productSlugOrId,
      rating,
      title,
      body,
      authorName: session.user.name ?? undefined,
      status: "PENDING",
    });
    redirect("/me");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-semibold">Donner un avis</h1>
      <form action={action} className="mt-4 space-y-4">
        <input type="hidden" name="productSlugOrId" value={productSlugOrId} />
        <div>
          <label className="block text-sm font-medium">Note (1 à 5)</label>
          <input
            type="number"
            name="rating"
            min={1}
            max={5}
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Titre</label>
          <input name="title" className="mt-1 w-full rounded-lg border px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Votre avis</label>
          <textarea name="body" rows={6} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </div>
        <div className="flex justify-end">
          <button className="btn" type="submit">Publier (après validation)</button>
        </div>
      </form>
    </div>
  );
}
