"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/reviews", label: "Avis" },
  { href: "/admin/tests", label: "Tests (à venir)" },
  { href: "/admin/categories", label: "Catégories (à venir)" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="mt-4 flex gap-2">
      {links.map((l) => {
        const active = pathname?.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3 py-2 rounded-lg text-sm border transition ${
              active ? "bg-brand-500 text-white border-brand-600"
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
