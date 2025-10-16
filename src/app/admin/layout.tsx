import type { ReactNode } from "react";
import AdminNav from "@/components/AdminNav";

export const metadata = {
  title: "Admin | Meilleur-ski",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container-page py-6">
      <h1 className="text-2xl font-semibold">Administration</h1>
      <AdminNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
