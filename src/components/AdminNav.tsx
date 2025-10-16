// src/components/AdminNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/reviews", label: "Avis" },
  { href: "/admin/tests", label: "Tests" },
  { href: "/admin/categories", label: "Catégories" },
];

export default function AdminNav() {
  const pathname = usePathname();
  if (pathname === "/admin") return null;

  return (
    <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
      {links.map((l) => {
        const active = pathname?.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3 py-2 rounded-lg text-sm border transition whitespace-nowrap ${
              active
                ? "bg-brand-500 text-white border-brand-600"
                : "bg-white text-ink border-ring hover:bg-muted"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
