"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur">
      {/* Barre colorée */}
      <div className="h-1 w-full brand-gradient" />

      <div className="bg-bg/80 supports-[backdrop-filter]:backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
          <Logo />

          {/* Search */}
          <form action="/search" className="flex-1">
            <div className="relative">
              <input
                name="q"
                placeholder="Rechercher un ski, modèle ou marque…"
                className="w-full rounded-xl bg-white/95 text-ink border border-ring px-4 py-2 pr-20 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                aria-label="Rechercher"
                className="absolute right-1 top-1 rounded-lg px-3 py-1.5 bg-sec-500 hover:bg-sec-600 text-white text-sm"
              >
                Rechercher
              </button>
            </div>
          </form>

          {/* Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((n) => {
              const active = pathname?.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`px-3 py-2 text-sm rounded-lg transition ${
                    active
                      ? "bg-brand-500/20 text-white border border-white/10"
                      : "text-brand-200 hover:text-white hover:bg-brand-500/15"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
