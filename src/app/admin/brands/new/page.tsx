import Link from "next/link";
import { createBrand } from "../actions";
import BrandForm from "../BrandForm";
import Breadcrumbs from "@/components/Breadcrumbs";
import { redirect } from "next/navigation";

export default function NewBrandPage() {
  async function onSubmit(form: FormData) {
    "use server";
    await createBrand(form);
    redirect("/admin/brands");
  }

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ href: "/admin", label: "Admin" }, { href: "/admin/brands", label: "Marques" }, { label: "Nouvelle" }]} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Nouvelle marque</h1>
        <Link href="/admin/brands" className="btn btn-ghost">Retour</Link>
      </div>
      <div className="card p-4">
        <BrandForm onSubmit={onSubmit} />
      </div>
    </div>
  );
}
