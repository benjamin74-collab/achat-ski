import Link from "next/link";
import { redirect } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import CookieForm from "../CookieForm";
import { createCookieDef } from "../actions";

export default function NewCookiePage() {
  async function onSubmit(fd: FormData) {
    "use server";
    await createCookieDef(fd);
    redirect("/admin/cookies");
  }

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ href: "/admin", label: "Admin" }, { href: "/admin/cookies", label: "Cookies" }, { label: "Nouveau" }]} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Nouveau cookie</h1>
        <Link href="/admin/cookies" className="btn btn-ghost">Retour</Link>
      </div>

      <div className="card p-4">
        <CookieForm onSubmit={onSubmit} />
      </div>
    </div>
  );
}