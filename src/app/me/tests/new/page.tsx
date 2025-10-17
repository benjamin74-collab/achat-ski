import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { createTest } from "@/app/actions/tests";

export default async function NewTestPage({
  searchParams,
}: {
  searchParams: { productId?: string; slug?: string };
}) {
  const outerSession = await getServerSession(authOptions);
  if (!outerSession) redirect("/api/auth/signin?callbackUrl=/me/tests/new");

  const productKey = searchParams.slug ?? searchParams.productId ?? null;
  if (!productKey) return notFound();
  const productSlugOrId = String(productKey);

  async function action(formData: FormData) {
    "use server";
    const session = await getServerSession(authOptions);
    if (!session) redirect("/api/auth/signin?callbackUrl=/me/tests/new");

    const title = String(formData.get("title") ?? "");
    const excerpt = String(formData.get("excerpt") ?? "");
    const scoreVal = formData.get("score");
    const score = scoreVal != null && scoreVal !== "" ? Number(scoreVal) : null;
    const sourceName = String(formData.get("sourceName") ?? "");
    const sourceUrl = String(formData.get("sourceUrl") ?? "");

    await createTest({
      productSlugOrId,
      title,
      excerpt,
      score,
      sourceName,
      sourceUrl,
      status: "PENDING",
    });
    redirect("/me");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-semibold">Ajouter un test</h1>
      <form action={action} className="mt-4 space-y-4">
        <input type="hidden" name="productSlugOrId" value={productSlugOrId} />
        {/* ... champs inchangés ... */}
        <div className="flex justify-end">
          <button className="btn" type="submit">Envoyer (après validation)</button>
        </div>
      </form>
    </div>
  );
}
