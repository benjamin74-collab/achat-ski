// src/app/admin/layout.tsx
import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
// ⬇️ Utiliser le bon chemin
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session || role !== "ADMIN") return notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-12 gap-6">
      <aside className="col-span-12 md:col-span-3 lg:col-span-3">
        <AdminSidebar />
      </aside>
      <section className="col-span-12 md:col-span-9 lg:col-span-9">
        {children}
      </section>
    </div>
  );
}
