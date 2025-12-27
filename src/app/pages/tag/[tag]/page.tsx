// src/app/pages/tag/[tag]/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";

export const revalidate = 120;

type Props = { params: { tag: string } };

export async function generateMetadata({ params }: Props, _parent: ResolvingMetadata): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://achat-ski.vercel.app"}/pages/tag/${encodeURIComponent(tag)}`;
  return {
    title: `Articles #${tag} — Meilleur-ski`,
    description: `Tous nos articles taggés #${tag}.`,
    alternates: { canonical: url },
    openGraph: { title: `Articles #${tag} — Meilleur-ski`, url },
  };
}

export default async function TagPage({ params }: Props) {
  const tag = decodeURIComponent(params.tag);

  const rows = await prisma.page.findMany({
    where: { published: true, tags: { has: tag } },
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, title: true, intro: true, thumbnailUrl: true, createdAt: true },
  });

  return (
    <main className="container-page py-8">
      <h1 className="text-2xl font-semibold"># {tag}</h1>
      <p className="mt-1 text-neutral-600">Articles associés au tag.</p>

      <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((p) => (
          <li key={p.id} className="rounded-2xl border p-3 hover:shadow-sm transition bg-white">
            <Link href={`/pages/${p.slug}`} className="block">
              <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border bg-muted">
                {p.thumbnailUrl ? (
                  <img src={p.thumbnailUrl} className="h-full w-full object-cover" alt={p.title} loading="lazy" />
                ) : null}
              </div>
              <div className="mt-3">
                <h2 className="font-semibold">{p.title}</h2>
                {p.intro ? <p className="text-sm text-neutral-600 mt-1 line-clamp-3">{p.intro}</p> : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <Link href="/pages" className="text-sm underline text-neutral-600">
          ← Tous les articles
        </Link>
      </div>
    </main>
  );
}
