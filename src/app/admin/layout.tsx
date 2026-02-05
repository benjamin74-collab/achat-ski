// src/app/admin/layout.tsx
import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import AdminSidebar from "@/components/admin/AdminSidebar";

function getSiteSlugFromHost(host: string): string {
  const raw = process.env.SITE_HOST_MAP;
  if (raw) {
    try {
      const map = JSON.parse(raw) as Record<string, string>;
      const found = map[host];
      if (found) return found;
    } catch {
      // ignore
    }
  }

  if (host.includes("meilleur-robot")) return "meilleur-robot";
  if (host.includes("meilleur-ski") || host.includes("achat-ski")) return "meilleur-ski";
  return process.env.DEFAULT_SITE_SLUG || "meilleur-ski";
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session || role !== "ADMIN") return notFound();

  const host = (headers().get("host") || "").toLowerCase().split(":")[0];
  const currentSite = getSiteSlugFromHost(host);

  const userSiteId = (session.user as any).siteId as string | null | undefined;
  if (userSiteId && userSiteId !== currentSite) return notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-12 gap-6">
      <aside className="col-span-12 md:col-span-3 lg:col-span-3">
        <AdminSidebar />
      </aside>
      <section className="col-span-12 md:col-span-9 lg:col-span-9">{children}</section>
    </div>
  );
}
