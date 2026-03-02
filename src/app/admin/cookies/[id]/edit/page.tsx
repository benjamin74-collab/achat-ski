import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";
import CookieForm from "../../CookieForm";
import { updateCookieDef, deleteCookieDef } from "../../actions";
import { redirect } from "next/navigation";
import type { CookiePurpose } from "@prisma/client";

export default async function EditCookiePage({ params }: { params: { id: string } }) {
  const id = Number(params.id);

  const item = await prisma.cookieDefinition.findUnique({ where: { id } });

  if (!item) {
    return (
      <div className="container-page py-8">
        <Breadcrumbs items={[{ href: "/admin", label: "Admin" }, { href: "/admin/cookies", label: "Cookies" }]} />
        <p>Cookie introuvable.</p>
      </div>
    );
  }

  async function onSubmit(fd: FormData) {
    "use server";
    await updateCookieDef(id, fd);
    redirect("/admin/cookies");
  }

  async function onDelete() {
    "use server";
    await deleteCookieDef(id);
    redirect("/admin/cookies");
  }

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/cookies", label: "Cookies" },
          { label: `Éditer: ${item.name}` },
        ]}
      />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Éditer le cookie</h1>
        <Link href="/admin/cookies" className="btn btn-ghost">
          Retour
        </Link>
      </div>

      <div className="card p-4">
        <CookieForm
          initial={{
            siteId: item.siteId ?? null,
            key: item.key,
            name: item.name,
            provider: item.provider ?? null,
            purpose: item.purpose as CookiePurpose,
            description: item.description ?? null,
            durationDays: item.durationDays ?? null,
            mandatory: item.mandatory,
          }}
          onSubmit={onSubmit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}