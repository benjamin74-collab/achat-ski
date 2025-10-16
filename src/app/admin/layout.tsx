// src/app/admin/layout.tsx
import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "Administration — Meilleur-ski",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-120px)]"> {/* laisse l’en-tête / pied de page en place */}
      <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="md:col-span-3">
          <div className="sticky top-[72px]"> {/* reste visible au scroll */}
            <AdminSidebar />
          </div>
        </aside>

        {/* Contenu */}
        <section className="md:col-span-9">
          {children}
        </section>
      </div>
    </div>
  );
}
