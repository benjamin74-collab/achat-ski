import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 300;

export default async function BrandsDirectoryPage() {
  const brands = await prisma.brand.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, logoUrl: true }
  });

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ href: "/", label: "Accueil" }, { label: "Marques" }]} />
      <h1 className="text-xl font-bold mb-4">Toutes les marques</h1>

      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {brands.map((b) => (
          <li key={b.id} className="rounded-xl border p-4 hover:bg-accent/30 flex flex-col items-center gap-2">
            {b.logoUrl ? <img src={b.logoUrl} alt="" width={60} height={60} /> : null}
            <Link href={`/marques/${b.slug}`} className="font-medium">{b.name}</Link>
          </li>
        ))}
        {brands.length === 0 && <li className="text-neutral-500">Aucune marque active</li>}
      </ul>
    </div>
  );
}
