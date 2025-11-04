import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateBrand, deleteBrand } from "../../actions";
import BrandForm from "../../BrandForm";
import Breadcrumbs from "@/components/Breadcrumbs";
import { redirect } from "next/navigation";

export default async function EditBrandPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const brand = await prisma.brand.findUnique({ where: { id } });
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

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ href: "/admin", label: "Admin" }, { href: "/admin/brands", label: "Marques" }, { label: `Éditer: ${brand.name}` }]} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Éditer la marque</h1>
        <Link href="/admin/brands" className="btn btn-ghost">Retour</Link>
      </div>
      <div className="card p-4">
        <BrandForm
          initial={{
            id: brand.id,
            name: brand.name,
            slug: brand.slug,
            websiteUrl: brand.websiteUrl,
            logoUrl: brand.logoUrl,
            description: brand.description,
            active: brand.active,
          }}
          onSubmit={onSubmit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
