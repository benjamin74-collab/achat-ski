// src/components/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/reviews", label: "Avis" },
  { href: "/admin/tests", label: "Tests" },
  { href: "/admin/categories", label: "Catégories" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="rounded-2xl border border-ring bg-surface/60 p-3">
      <h2 className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Administration
      </h2>
      <ul className="space-y-1">
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-brand-500 text-white"
                    : "text-ink hover:bg-muted"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
