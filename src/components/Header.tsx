// src/components/Header.tsx
"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Logo from "./Logo";

const nav = [
  { href: "/c/skis-all-mountain", label: "Skis All-Mountain" },
  { href: "/c/skis-freeride", label: "Skis Freeride" },
  { href: "/c/skis-rando", label: "Skis Rando" },
  { href: "/c/fixations", label: "Fixations" },
  { href: "/c/chaussures", label: "Chaussures" },
];

export default function Header() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";

  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-bg/70 bg-bg/90 border-b border-ring">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="shrink-0 hover:opacity-90">
          <Logo />
        </Link>

        {/* Search */}
        <form action="/search" className="flex-1">
          <div className="relative">
            <input
              name="q"
              defaultValue={q}
              placeholder="Rechercher un ski, un modèle, une marque…"
              className="w-full rounded-xl bg-surface/70 border border-ring px-4 py-2 pr-10 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              aria-label="Rechercher"
              className="absolute right-1 top-1 rounded-lg px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm"
            >
              Go
            </button>
          </div>
        </form>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-3">
          {nav.map((n) => {
            const active = pathname?.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`text-sm px-3 py-2 rounded-lg border border-transparent hover:border-ring hover:bg-surface/60 ${active ? "bg-surface text-white" : "text-slate-200"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
