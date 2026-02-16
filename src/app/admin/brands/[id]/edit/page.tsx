import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateBrand, deleteBrand } from "../../actions";
import BrandForm from "../../BrandForm";
import Breadcrumbs from "@/components/Breadcrumbs";
import { redirect } from "next/navigation";
import type { MediaAsset } from "@prisma/client";

type BrandWithLogo = {
  id: number;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  active: boolean;

  // ✅ relation (optionnelle)
  logoId: number | null;
  logo: Pick<MediaAsset, "id" | "publicUrl" | "alt" | "title"> | null;

  // ✅ nouveaux champs optionnels (si tu les as ajoutés au modèle Brand)
  bannerUrl?: string | null;
  bannerId?: number | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

export default async function EditBrandPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);

  const brand = (await prisma.brand.findUnique({
    where: { id },
    include: {
      logo: { select: { id: true, publicUrl: true, alt: true, title: true } },
      // si tu as une relation banner, ajoute-la ici :
      // banner: { select: { id: true, publicUrl: true, alt: true, title: true } },
    },
  })) as BrandWithLogo | null;

  if (!brand) {
    return (
      <div className="container-page py-8">
        <Breadcrumbs items={[{ href: "/admin", label: "Admin" }, { href: "/admin/brands", label: "Marques" }]} />
        <p>Marque introuvable.</p>
      </div>
    );
  }

  async function onSubmit(form: FormData) {
    "use server";
    await updateBrand(id, form);
    redirect("/admin/brands");
  }

  async function onDelete() {
    "use server";
    await deleteBrand(id);
    redirect("/admin/brands");
  }

  // ✅ URL logo “effective” (asset > fallback url)
  const logoEffectiveUrl = brand.logo?.publicUrl ?? brand.logoUrl ?? null;

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/brands", label: "Marques" },
          { label: `Éditer: ${brand.name}` },
        ]}
      />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Éditer la marque</h1>
        <Link href="/admin/brands" className="btn btn-ghost">
          Retour
        </Link>
      </div>

      <div className="card p-4">
        <BrandForm
          initial={{
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            websiteUrl: brand.websiteUrl,
            logoUrl: logoEffectiveUrl,
            description: brand.description,
            active: brand.active,

            // ✅ si ton BrandForm supporte ces champs, tu peux les passer :
            bannerUrl: brand.bannerUrl ?? null,
            metaTitle: brand.metaTitle ?? null,
            metaDescription: brand.metaDescription ?? null,
          }}
          onSubmit={onSubmit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
