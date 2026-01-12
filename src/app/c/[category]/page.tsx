// src/app/c/[category]/page.tsx
import { redirect } from "next/navigation";

type PageParams = { category: string };

// ⚠️ On garde /c/[slug] uniquement pour compat + SEO.
// Redirection 301 vers l’URL courte /[slug]
export default async function LegacyCategoryRedirect({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { category } = await params;
  redirect(`/${category}`);
}
