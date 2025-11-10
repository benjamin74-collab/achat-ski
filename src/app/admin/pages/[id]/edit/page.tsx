// src/app/admin/pages/[id]/edit/page.tsx
import { prisma } from "@/lib/prisma";
import PageForm from "../../_PageForm";

export default async function EditPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const p = await prisma.page.findUnique({
    where: { id },
    include: {
      thumbnail: { select: { id: true, publicUrl: true } },
      banner: { select: { id: true, publicUrl: true } },
    },
  });
  if (!p) return <div>Introuvable</div>;

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Éditer : {p.title}</h1>
      <PageForm
        initial={{
          id: p.id,
          title: p.title,
          slug: p.slug,
          intro: p.intro,
          content: p.content,
          // fallbacks URL existants
          thumbnailUrl: p.thumbnailUrl,
          bannerUrl: p.bannerUrl,
          // pré-remplissage médiathèque
          thumbnailAssetId: p.thumbnail?.id ?? null,
          thumbnailAssetUrl: p.thumbnail?.publicUrl ?? null,
          bannerAssetId: p.banner?.id ?? null,
          bannerAssetUrl: p.banner?.publicUrl ?? null,
          published: p.published,
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
          tags: p.tags,
        }}
      />
    </div>
  );
}
